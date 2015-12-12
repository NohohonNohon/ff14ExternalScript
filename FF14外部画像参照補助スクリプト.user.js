// ==UserScript==
// @name        FF14外部画像参照補助スクリプト
// @namespace   nohohon
// @description FF14の外部画像参照機能をアップロードから登録まで行えるようにする
// @include     http://jp.finalfantasyxiv.com/lodestone/my/blog/post/*
// @include     https://picasaweb.google.com/*
// @include     https://docs.google.com/picker?protocol=iframes*
// @version     1
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @grant       GM_log
// @grant       GM_registerMenuCommand
// @grant       GM_xmlhttpRequest
// @grant       GM_getResourceText
// @resource   usconfigcss https://raw.github.com/NohohonNohon/ff14ExternalScript/master/usconfig.css.template
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
        
    //共通変数
        /** 設定値 */
        var settings = {upload_URL:'',user_ID:'',album_ID:'',open_type:''};
    
    
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
            if($('#add_hidden_area')[0] == null) {
                var hidden_area = $('#external_file_uri').parents('.hidden_area');
                hidden_area.wrapAll("<div id='add_hidden_area' style='display: none;'></div>");
            }
            //アップロードサイトを表示する
            if (settings.upload_URL == '') {
                alert('アップロードの設定をしてください。');
                Config.open();
                return false;
            }
            var target_window;
            if (settings.open_type ==  OPEN_WINDOW_TYPE.popup){
                target_window = window.open(settings.upload_URL,UPLOAD_WINDOW_NAME,'toolbar=no,titlebar=no,status=no,scrollbars=yes,resizable=yes,menubar=no,location=no');
            } else if(settings.open_type ==  OPEN_WINDOW_TYPE.tab) {
                target_window = window.open(settings.upload_URL,UPLOAD_WINDOW_NAME,'');
            }
            //開いた画面が閉じるのを監視する。
            setTimeout(function loop(){
                try {
                    if(target_window.closed == false){
                        setTimeout(loop,100);
                    } else {
                        FF14.setImgDataURL();
                    }
                } catch(err) {
                    FF14.setImgDataURL();
                }
            },100);
        };
        
        var gloabl = {
            
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
                $('#uploadfiles')[0].click();
                return true;
            }
        };
        return gloabl;
    })();
    
    
    //==================================================
    /** Picasaのページ関連処理 */
    //==================================================
    var Picasa = (function() {
        var COMPLEATED_MSG = 'get Image URL Compleated';
        
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
            getNewImg();
        };
        
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
                        window.parent.postMessage(COMPLEATED_MSG, 'https://picasaweb.google.com');
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
        };
        
        /** 
        * アルバムの公開状態を確認する
        */
        function checkAlbumPublic() {
            var url = 'https://picasaweb.google.com/data/feed/api/user/' + 
                            settings.user_ID+ '/albumid/' + settings.album_ID +
                            '?alt=json&max-results=1';
            GM_xmlhttpRequest({
            method: 'get',
            url: url,
            onload: function(res) {
                    if (res.responseText == 'No album found.') {
                        alert('アルバムが公開されていません。\nアルバムを一般公開状態にしてください。');
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
        };
        
        /** 
        * 子ページの要求により、画面を閉じる
        * @param {event} イベント
        */
        function closeWindow(e) {
            if(e.originalEvent.data != COMPLEATED_MSG) {
                return false;
            }
            window.close();
        }
        
        var global = {
            /** アップロードした画像枚数*/
            img_upload_count: 0,
            
            /** 
            * Picasaページ関連処理の初期処理
            */
            initPicasa: function() {
                //ページ遷移時画面を閉じる
                $(window).on('beforeunload', function() {window.close();});
                //画像URL取得成功後画面を閉じる
                $(window).on('message', closeWindow);
                //1000枚を超えそうな場合警告
                var img_count = $('#lhid_albumcontains').text();
                if(Number(img_count) >950) {
                    alert('アルバム内の画像枚数が1000枚を超えそうです。\n1000枚を超えると画像のURLが取得できません。');
                }
                //アルバムの公開状態を確認
                checkAlbumPublic();
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
            }
        };
        return global;
    })();
    
    
    //==================================================
    /** 設定関連処理 */
    //==================================================
    (function() {
        Config.define('setting', function() {
            with (this.builder) {
            var open_option = [
                'ポップアップ',
                '新規タブ'
            ]
            dialog(
                'コンフィグ',
                { width: 500, height: 300 },
                section(
                        'アップロード',
                        'アップロードに関する設定をします。',
                        grid(
                            text('アップロード画面URL:', 'upload_URL', '', { size: 40 }), '\n',
                            text('ユーザID:', 'user_ID', '', { size: 40 }), '\n',
                            text('アルバムID:', 'album_ID', '', { size: 40 }), '\n',
                            select('表示方法', 'open_type', open_option, 'ポップアップ')
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

        };
        
        /** 
        * アップロード画面URLに外部画像参照であることを示すクエリ文字列を付与する
        * @param {event} イベント
        */
        function setExternalFlag(e) {
            var URL = $(e.target).val();
            $(e.target).val(URL + UPLOAD_WINDOW_QUERY);
        };
    })();
    
    //==================================================
    /** メイン関数 */
    //==================================================
    function main() {
        //ページ毎の初期処理呼び出す
        var this_domain = window.location.host;
        var window_name = window.name;
        if(this_domain == 'jp.finalfantasyxiv.com') {
            FF14.init();
            return true;
        }
        switch (this_domain){
            case 'picasaweb.google.com':
                if(window_name != UPLOAD_WINDOW_NAME) {
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