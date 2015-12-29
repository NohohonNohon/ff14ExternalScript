// ==UserScript==
// @name        FF14外部画像参照補助スクリプト
// @namespace   nohohon
// @author      nohohon
// @description FF14の外部画像参照機能を使って外部画像を楽に登録できるようにするスクリプト
// @include     http://jp.finalfantasyxiv.com/lodestone/my/blog/*
// @include     https://picasaweb.google.com/*
// @include     https://docs.google.com/picker?protocol=iframes*
// @version     1.1.2
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @grant       GM_log
// @grant       GM_registerMenuCommand
// @grant       GM_xmlhttpRequest
// @grant       GM_getResourceText
// @resource    usconfigcss https://raw.github.com/NohohonNohon/ff14ExternalScript/master/usconfig.css.template
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @require     https://raw.github.com/NohohonNohon/ff14ExternalScript/master/usconfig.js
// ==/UserScript==
(function($) {
    //共通定数
        /** 画像URLリストを格納するGM_Value名称 */
        var IMG_LIST_ARRAY = 'img_list_array';
        
        /** アップロード画面のウィンドウ名 */
        var UPLOAD_WINDOW_NAME = 'img_upload';
        /** アップロード画面URLに付与するクエリ文字列 */
        var UPLOAD_WINDOW_QUERY = '&external=true';
        
        /** ウィンドウ表示方法 */
        var OPEN_WINDOW_TYPE = {popup:'ポップアップ',tab:'新規タブ'};
        /** 画像のアップロード有無 */
        var UPLOAD_FLAG = {true:'画像をアップロードする',false:'画像をアップロードしない'};
        /** URL入力欄表示有無 */
        var HIDDEN_INPUT = {true:'非表示にする',false:'非表示にしない'};
        /** URL自動登録有無 */
        var UPLOAD_AUTO = {true:'アップロードする',false:'アップロードしない'};        
        /** 開いた画面を閉じるpostMessage */
        var CLOSE_WINDOW = 'close_window';

    //共通変数
        /** 設定値 */
        var settings = {upload_URL:'',user_ID:'',album_ID:'',open_type:'',popup_width:'',popup_height:'',upload_flag:'',hidden_input:'',upload_auto:''};
    
    
    //==================================================
    /** FF14のページ関連処理 */
    //==================================================
    var FF14 = (function() {
        
        /**
        * 外部画像参照ボタン押下時の処理
        * @param {event} イベント
        */
        function clickEmbedBtn(e) {
            //外部参照欄を非表示にする
            if(settings.hidden_input == HIDDEN_INPUT.true && $('#add_hidden_area')[0] == null) {
                var hidden_area = $('#external_file_uri').parents('.hidden_area');
                hidden_area.wrapAll("<div id='add_hidden_area' style='display: none;'></div>");
            }
            //アップロードサイトを表示する
            if (settings.upload_URL == '') {
                alert('アップロードの設定をしてください。');
                Config.open();
                return false;
            }
            try {
                if(FF14.target_window.closed == false){
                    return false;
                }
            } catch(e) {
                //target_windowが無くエラーになることがあるが何もしない
            }
            if (settings.open_type ==  OPEN_WINDOW_TYPE.popup){
                var param = 'width=' + settings.popup_width + ',height=' + settings.popup_height + 
                    ',toolbar=no,titlebar=no,status=no,scrollbars=yes,resizable=yes,menubar=no,location=no';
                FF14.target_window = window.open(settings.upload_URL,UPLOAD_WINDOW_NAME,param);
            } else if(settings.open_type ==  OPEN_WINDOW_TYPE.tab) {
                FF14.target_window= window.open(settings.upload_URL,UPLOAD_WINDOW_NAME,'');
            }
            $(window).on('message', closeWindow);
            //開いた画面が閉じるのを監視する。
            setTimeout(function loop(){
                try {
                    if(FF14.target_window.closed == false){
                        setTimeout(loop,100);
                    } else {
                        FF14.setImgDataURL();
                    }
                } catch(err) {
                    FF14.setImgDataURL();
                }
            },100);
        }
        
        /** 
        * 子ページの要求により、画面を閉じる
        * @param {event} イベント
        */
        function closeWindow(e) {
            if(e.originalEvent.data == CLOSE_WINDOW) {
                FF14.target_window.close();
                $(window).off('message', closeWindow);
            } else {
                return true;
            }
        }
        
        var global = {
            /** アップロード画面のウィンドウオブジェクト */
            target_window:'',
            
            /**
             * FF14ページ関連処理の初期処理
             */
            init: function() {
                $('#embedfiles').on('click',clickEmbedBtn);
                GM_registerMenuCommand('FF14外部画像参照補助(設定)', Config.open);
            },
            
            /** 
            * アップロードした画像のURLを登録する
            */
            setImgDataURL: function() {
                var img_list_array = GM_getValue(IMG_LIST_ARRAY);
                GM_deleteValue(IMG_LIST_ARRAY);
                if(img_list_array ==null ){
                    return false;
                }
                for(var i=0; i<img_list_array.length; i++){
                    $('#external_file_uri').val(img_list_array[i]);
                    $('#external_file_select').click();
                }
                //登録と同時にアップロードする
                if(settings.upload_auto == UPLOAD_AUTO.true) {
                    $('#uploadfiles')[0].click();
                }
                return true;
            }
        };
        return global;
    })();
    
    
    //==================================================
    /** Picasaのページ関連処理 */
    //==================================================
    var Picasa = (function() {
        var EXIT_MSG = 'EXIT';
        var CANCEL_MSG = 'CANCEL';
        
        /** 
        * OKボタンクリック時、アップロード枚数をカウントし、getNewImg()を呼び出す
        * @param {event} イベント
        */
        function clickOKBtn(e) {
            var disabled_state = $('#picker\\:ap\\:0').attr('aria-disabled');
            if (disabled_state == 'true') {
                return false;
            }
            Picasa.img_upload_count = $("div[role ='listbox']").children().children().length;
            if (Picasa.img_upload_count > 10) {
                alert('写真の枚数が10枚を超えています。\n10枚以下にしてください。');
                return false;
            }
            getNewImg();
        }
        
        /** 
        * キャンセルボタンクリック時、画面を閉じるようにする
        * @param {event} イベント
        */
        function clickCancelBtn(e) {
            window.parent.postMessage(CANCEL_MSG, 'https://picasaweb.google.com');
        }
        
        /** 
        * img_upload_countに指定した枚数分の新着画像のURLを取得し、画面を閉じる
        */
        function getNewImg() {
            var url = 'https://picasaweb.google.com/lh/reorder?uname=' + 
                            settings.user_ID+ '&aid=' + settings.album_ID;
            GM_xmlhttpRequest({
            method: 'get',
            url: url,
                onload: function(res) {
                    try {
                        //ページのソースから画像データ部分を抜き出す
                        var data_pattern = /_reorganize\(\[[\s\S]*}\]\);/;
                        var url_pattern = /s:'.*',t/ig;
                        var img_data = res.responseText.match(data_pattern)[0];
                        var img_url_list  = img_data.match(url_pattern);
                        var end_count = img_url_list.length
                        var start_count = end_count - Picasa.img_upload_count;
                        var img_array = [];
                        for(var i = start_count;i < end_count; i++) {
                            var img_url = img_url_list[i].match(/'(.*)'/)[1];
                            img_url = img_url.replace(/\\x2F/g,'/');
                            img_url = img_url.replace(/\/Ic42\//g , '/s2048-Ic42/');
                            img_array.push(img_url);
                        }
                        GM_setValue(IMG_LIST_ARRAY,img_array);
                        //親ページに処理完了を伝える
                        window.parent.postMessage(EXIT_MSG, 'https://picasaweb.google.com');
                    } catch(err) {
                        alert('画像のURL取得に失敗しました。');
                        console.log(err);
                    }
                },
                onerror: function(res) {
                    alert('画像のURL取得に失敗しました。');
                    var msg = "An error occurred."
                        + "\nresponseText: " + res.responseText
                        + "\nreadyState: " + res.readyState
                        + "\nresponseHeaders: " + res.responseHeaders
                        + "\nstatus: " + res.status
                        + "\nstatusText: " + res.statusText
                        + "\nfinalUrl: " + res.finalUrl;
                    console.log(msg);
                },
                ontimeout: function() {
                    alert('接続がタイムアウトしました。');
                }
            });
        }
        
        /** 
        * アルバムの公開状態を確認する
        * @param {function} コールバック関数(省略可) 
        */
        function checkAlbumPublic(call_back_func) {
            var url = 'https://picasaweb.google.com/data/feed/api/user/' + 
                            settings.user_ID+ '/albumid/' + settings.album_ID +
                            '?alt=json&max-results=1';
            GM_xmlhttpRequest({
            method: 'get',
            url: url,
            onload: function(res) {
                    if (res.responseText == 'No album found.') {
                        alert('アルバムが公開されていません。\nアルバムを一般公開状態にしてください。');
                    } else {
                        call_back_func();
                    }
                },
                onerror: function(res) {
                    var msg = "An error occurred."
                        + "\nresponseText: " + res.responseText
                        + "\nreadyState: " + res.readyState
                        + "\nresponseHeaders: " + res.responseHeaders
                        + "\nstatus: " + res.status
                        + "\nstatusText: " + res.statusText
                        + "\nfinalUrl: " + res.finalUrl;
                    console.log(msg);
                },
                ontimeout: function() {
                    console.log('checkAlbumPublic() is Timout');
                }
            });
        }
        
        /** 
        * 画像をアップロードしない設定の場合、枚数を指定して新着画像URLを取得する
        */
        function getNewImgCount() {
            //アップロードフラグの確認
            if(settings.upload_flag == UPLOAD_FLAG.false) {
                var count;
                while (count == null){
                    count = window.prompt('新着画像URL取得枚数を入力してください。(1から10までの数値)', '');
                    if(count == null) {
                        alert('新着画像URL取得をキャンセルします。');
                        window.opener.postMessage(CLOSE_WINDOW, 'http://jp.finalfantasyxiv.com');
                        break;
                    }
                    if(count.match(/[^0-9]+/)){
                        alert('1から10までの数値を入力してください。');
                        count = null;
                    } else if(count < 1 || count > 10) {
                        alert('1から10までの数値を入力してください。');
                        count = null;
                    } else {
                        Picasa.img_upload_count = count;
                        getNewImg();
                    }
                }
            }
        }
        
        /** 
        * 子ページの要求により、画面を閉じる
        * @param {event} イベント
        */
        function closeWindow(e) {
            if(e.originalEvent.data == EXIT_MSG) {
                window.opener.postMessage(CLOSE_WINDOW, 'http://jp.finalfantasyxiv.com');
            } else if(e.originalEvent.data == CANCEL_MSG) {
                //ページ遷移時画面を閉じる
                $(window).on('beforeunload', function() {window.opener.postMessage(CLOSE_WINDOW, 'http://jp.finalfantasyxiv.com');});
            }
        }
        
        var global = {
            /** アップロードした画像枚数*/
            img_upload_count: 0,
            
            /** 
            * Picasaページ関連処理の初期処理
            */
            initPicasa: function() {
                //キャンセルボタンクリック時のメッセージを変更
                $('#lhid_pickerredirect').text('写真のアップロードをキャンセルしています...');
                //子ページの要求に応じて画面を閉じる
                $(window).on('message', closeWindow);
                //1000枚を超えそうな場合警告
                var img_count = $('#lhid_albumcontains').text();
                if(Number(img_count) >950) {
                    alert('アルバム内の画像枚数が1000枚を超えそうです。\n1000枚を超えると画像のURLが取得できません。');
                }
                //アルバムの公開状態を確認
                checkAlbumPublic(getNewImgCount);
            },
            
            /** 
            * アップロード画面のiframe内の処理
            */
            initDocs: function() {
                //OKボタンをGM用に書き換える
                //OKボタンが生成されるタイミングが不明のため、マウスムーブのたびにチェックする
                $(window).on('mousemove',function() {
                    var ok_btn = $('#picker\\:ap\\:0');
                    if(ok_btn[0] != null) {
                        ok_btn.before("<div id='picker_ap_0' class='a-b-c d-u d-u-F gg-tb-Og-enabled' style='-moz-user-select: none;'>OK</div>");
                        ok_btn.css('display', 'none');
                        var add_ok_btn = $('#picker_ap_0');
                        add_ok_btn.on('mouseover',function() {$(this).addClass('d-u-v');});
                        add_ok_btn.on('mouseout',function() {$(this).removeClass('d-u-v');});
                        add_ok_btn.on('click',clickOKBtn);
                        $(this).off('mousemove');
                    }
                })
                //キャンセルボタンにクリックイベントを設定
                //キャンセルボタンが生成されるタイミングが不明のため、マウスムーブのたびにチェックする
                $(window).on('mousemove',function() {
                    var cancel_btn = $('#picker\\:ap\\:1');
                    if(cancel_btn[0] != null) {
                        cancel_btn.on('click',clickCancelBtn);
                    }
                })
            }
        };
        return global;
    })();
    
    
    //==================================================
    /** 設定関連処理 */
    //==================================================
    //http://d.hatena.ne.jp/h1mesuke/20100713/p1
    (function() {
        Config.define('setting', function() {
            with (this.builder) {
            var open_type = [
                'ポップアップ',
                '新規タブ'
            ];
            var upload_flag = [
                '画像をアップロードする',
                '画像をアップロードしない'
            ];  
            var hidden_input = [
                '非表示にする',
                '非表示にしない'
            ];  
            var upload_auto = [
                'アップロードする',
                'アップロードしない'
            ];  
            dialog(
                    'コンフィグ',
                    { width: 600, height: 550 },
                    section(
                            'アップロード',
                            'アップロードに関する設定をします。',
                            grid(
                                text('アップロード画面URL:', 'upload_URL', '', { size: 40 }), '\n',
                                text('ユーザID:', 'user_ID', '', { size: 40 }), '\n',
                                text('アルバムID:', 'album_ID', '', { size: 40 }), '\n',
                                select('画像アップロード有無', 'upload_flag', upload_flag, '画像をアップロードする'), '\n',
                                select('URL入力欄を非表示にする', 'hidden_input', hidden_input, '非表示にしない'), '\n',
                                select('URL登録と同時にアップロード', 'upload_auto', upload_auto, 'アップロードしない')
                            )
                    ),
                    section(
                            '画面表示',
                            '画面表示に関する設定をします。',
                            grid(
                                select('表示方法', 'open_type', open_type, 'ポップアップ'), '\n',
                                staticText("ポップアップ時のウィンドウサイズ"), '\n',
                                number( "幅", 'popup_width', 800), '\n',
                                number( "高さ", 'popup_height', 600)
                            )
                    )
            );
            }
        }, {
            saveKey: 'GM_config',
            aftersave: function() {},
            afteropen : function() {
                var iframe_doc = this.frame.contentDocument;
                // アップロードURLの全選択
                $('#control_upload_URL', iframe_doc).on('click',function(){
                    $(this).select();
                });
                // ユーザID、アルバムIDの入力補助、クエリ文字列付与
                $('#control_upload_URL', iframe_doc).on('change',function(e) {
                    getID(e);
                    setExternalFlag(e);
                });
            }
        });
        settings = Config.load();
        
        /** 
        * アップロード画面URLからユーザID、アルバムIDを取得する
        * @param {event} イベント
        */
        function getID(e) {
            try{
                var dialog_element = $(e.target).parents('#setting_config_dialog');
                var url = $(e.target).val();
                var query =url.match(/\?(.*)/)[1].split('&');
                for(var i=0;query [i];i++) {
                    var key_value = query [i].split('=');
                    if(key_value[0] == 'uname') {
                        $('#control_user_ID',dialog_element).val(key_value[1]);
                    } else if(key_value[0] == 'aid') {
                        $('#control_album_ID',dialog_element).val(key_value[1]);
                    }
                }
            } catch(err) {
                console.log(err);
            }
        }
        
        /** 
        * アップロード画面URLに外部画像参照であることを示すクエリ文字列を付与する
        * @param {event} イベント
        */
        function setExternalFlag(e) {
            var URL = $(e.target).val();
            if(URL != '') {
                $(e.target).val(URL + UPLOAD_WINDOW_QUERY);
            }
        }
    })();
    
    //==================================================
    /** メイン関数 */
    //==================================================
    function main() {
        //ページ毎の初期処理呼び出す
        var this_domain = window.location.host;
        if(this_domain == 'jp.finalfantasyxiv.com') {
            FF14.init();
            return true;
        }
        switch (this_domain){
            case 'picasaweb.google.com':
                if(window.location.href != settings.upload_URL) {
                    return false;
                }
                Picasa.initPicasa();
                break;
            case 'docs.google.com':
                if(document.referrer != settings.upload_URL) {
                    return false;
                }
                Picasa.initDocs();
            default: 
                break;
        }
    }
    //メイン関数の呼び出し
    main();
})(jQuery);