// ==UserScript==
// @name        FF14外部画像参照補助スクリプト
// @namespace   nohohon
// @author      nohohon
// @description FF14の外部画像参照機能を使って外部画像を楽に登録できるようにするスクリプト
// @include     https://jp.finalfantasyxiv.com/lodestone/my/blog/*
// @include     https://jp.finalfantasyxiv.com/lodestone/my/image/*
// @include     https://jp.finalfantasyxiv.com/lodestone/my/event/post/*
// @include     https://jp.finalfantasyxiv.com/lodestone/freecompany/*
// @include     http://jp.finalfantasyxiv.com/lodestone/my/blog/*
// @include     http://jp.finalfantasyxiv.com/lodestone/my/image/*
// @include     http://jp.finalfantasyxiv.com/lodestone/my/event/post/*
// @include     http://jp.finalfantasyxiv.com/lodestone/freecompany/*
// @version     1.4.1
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @grant       GM_log
// @grant       GM_registerMenuCommand
// @grant       GM_getResourceText
// @resource    usconfigcss https://cdn.rawgit.com/NohohonNohon/ff14ExternalScript/master/usconfig.css.template
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @require     https://cdn.rawgit.com/NohohonNohon/ff14ExternalScript/master/usconfig.js
// ==/UserScript==
(function($) {
    //共通定数
        /** 画像URLリストを格納するGM_Value名称 */
        var IMG_LIST_ARRAY = 'img_list_array';

        /** URL入力欄表示有無 */
        var HIDDEN_INPUT = {true:'非表示にする',false:'非表示にしない'};
        /** URL自動登録有無 */
        var UPLOAD_AUTO = {true:'アップロードする',false:'アップロードしない'};
        /** 参照先 */
        var GOOGOLE_SERVICE = {photo:'Googleフォト',drive:'Googleドライブ'};


    //共通変数
        /** 設定値 */
        var settings = {hidden_input:'',upload_auto:'',google_service:''};
        /** サブウインドウオブジェクト*/
    　　var winObj = null;
        /** 未設定時に表示する文字列*/
    　　var view_tip = '';


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
                $('#external_file_uri').wrapAll("<div id='add_hidden_area' style='display: none;'></div>");
                $('#external_file_select').wrapAll("<div id='add_hidden_area' style='display: none;'></div>");
            }
            // Googleドライブ連携ページを新規ウィンドウで表示する
            const subw = 600;// サブウインドウの横幅
            const subh = 600;// サブウインドウの高さ
            var subp = '';// 表示するページ(URL)
            if (settings.google_service == GOOGOLE_SERVICE.photo) {
                subp = 'https://ff14chocopad.com/static/app/ff14-external-photo/jp/google-photo.html';
            } else {
                subp = 'https://ff14chocopad.com/static/app/ff14-external-photo/jp/google-script.html';
            }
            const subn = 'google-script';// サブウインドウの名称
            // 表示座標の計算
            const subx = ( screen.availWidth - subw ) / 2;// X座標
            const suby = ( screen.availHeight - subh ) / 2;// Y座標
            const features = `width=${subw},height=${subh},top=${suby},left=${subx},menubar=no,location=no,resizable=no,scrollbars=no,status=no`;
            winObj = window.open(subp,subn,features);
        }

        /**
        * サブウィンドウを閉じる
        */
        function closeWindow() {
            if( (winObj) && (!winObj.closed) ){ //サブウインドウが開かれているか？
                winObj.close(); //サブウインドウを閉じる
            }
            winObj = null;
        }

        /**
        * サブウィンドウをフォーカスする
        */
        function focusWindow() {
            if( (winObj) && (!winObj.closed) ){ //サブウインドウが開かれているか？
                winObj.focus(); //サブウインドウをフォーカスする
            }
        }
        
        var global = {
            
            /**
             * FF14ページ関連処理の初期処理
             */
            init: function() {
                $('#embedfiles').on('click',clickEmbedBtn);
                $('#select_box').on('click',closeWindow);
                $('.sys_upload_close').on('click',closeWindow);
                $(window).on('focus', focusWindow);
                GM_registerMenuCommand('FF14外部画像参照補助(設定)', FF14.openConfig);
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
                    $('.sys_upload_execute')[0].click();
                }
                return true;
            },

            /**
            * 設定画面を開く
            */
            openConfig: function() {
                Config.open();
            }
        };
        return global;
    })();
    
    
    //==================================================
    /** GooglePicker APIの関連処理 */
    //==================================================
    var GooglePicker = (function() {
        
        var PICKED_IMAGE_MSG = 'GOOGLE_PICKER_PICKED_IMAGE';
        
        /** 
        * コールバック関数呼び出しのためのPostMessage処理
        * @param {event} イベント
        */
        function callPostMessageFunction(e) {
            var data = e.originalEvent.data;
            if(!Array.isArray(data)) {
                return;
            }
            if(data[0] == PICKED_IMAGE_MSG) {
                afterImageWindow(data[1]);
            }
        }
        
        /**
         * Google API用のスクリプトの読み込み
         */
        function loadGoogleAPIScript() {
            $('<script>')
                .attr('src', 'https://www.google.com/jsapi?key=AIzaSyAqsQs8Saz2cWjL5zXvIw3UeTX38MUDbYs')
                .appendTo('head');
            $('<script>')
                .attr('src', 'https://apis.google.com/js/client.js?onload=onLoadGoogleAPI')
                .appendTo('head');
        }
        
        /** 
        * Google Pickerの画像選択後の処理
        * @param {imgList}
        */
        function afterImageWindow(imgList) {
            //最大数を超えた場合処理を中止する
            if(imgList.length > 10) {
                alert('一度に登録できる画像の枚数は10枚です。');
                return;
            }
            //外部画像参照URLを登録する
            GM_setValue(IMG_LIST_ARRAY,imgList);
            FF14.setImgDataURL();
        }
        
        var global = {
            
            /**
             * Google APIの関連処理の初期処理
             */
            init: function() {
                //コールバック関数のためにPostMessageイベントを登録
                $(window).on('message', callPostMessageFunction);
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
            var hidden_input = [
                '非表示にする',
                '非表示にしない'
            ];
            var upload_auto = [
                'アップロードする',
                'アップロードしない'
            ];
            var google_service = [
                'Googleフォト',
                'Googleドライブ'
            ];
            dialog(
                    '外部画像参照スクリプト<br>コンフィグ',
                    { width: 600, height: 500 },
                    section(
                            '画面表示',
                            '画面表示に関する設定をします。',
                            grid(
                                select('外部画像URL入力欄を非表示にする', 'hidden_input', hidden_input, '非表示にする'), '\n',
                                select('URL登録と同時にアップロード', 'upload_auto', upload_auto, 'アップロードしない')
                            ),
                    ),
                    section(
                            '画像の参照先',
                            `Googleフォト、Googleドライブのどちらから画像を参照するか設定します。${view_tip}`,
                            grid(
                                select('参照先', 'google_service', google_service, 'Googleフォト'), '\n',
                            )
                    )
            );
            }
        }, {
            saveKey: 'GM_config',
            aftersave: function() {},
            afteropen : function() {}
        });
        settings = Config.load();
        
    })();
    
    //==================================================
    /** メイン関数 */
    //==================================================
    function main() {
        FF14.init();
        GooglePicker.init();
        // 未設定の場合は設定画面を表示
        var config = GM_getValue('GM_config');
        if (config == null || config.indexOf("google_service") === -1) {
            view_tip = '<br><span style="color:red;font-weight:bold">参照先を選択して「保存」をしてください。</span>';
            Config.open();
        }
    }
    //メイン関数の呼び出し
    main();
})(jQuery);
