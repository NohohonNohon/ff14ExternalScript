// ==UserScript==
// @name        FF14外部画像参照補助スクリプト
// @namespace   nohohon
// @author      nohohon
// @description FF14の外部画像参照機能を使って外部画像を楽に登録できるようにするスクリプト
// @include     http://jp.finalfantasyxiv.com/lodestone/my/blog/*
// @version     1.2.0
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

    //共通変数
        /** 設定値 */
        var settings = {hidden_input:'',upload_auto:''};
    
    
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
            //GooglePicker.js側でクリックイベントをバインド
            //unsafeWindow.createPicker();
        }
        
        var global = {
            
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
    /** GooglePicker APIの関連処理 */
    //==================================================
    var GooglePicker = (function() {
        
        var SCRIPT_LOAD_MSG = 'GOOGLE_PICKER_SCRIPT_LOAD';
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
            if(data[0] == SCRIPT_LOAD_MSG) {
               loadGoogleAPIScript();
            } else if(data[0] == PICKED_IMAGE_MSG) {
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
        * @param {docデータ} 
        */
        function afterImageWindow(docData) {
            var img_array = [];
            for (var i = 0, len = docData.length; i < len; i++) {
                var img_url = docData[i].thumbnails[0].url;
                img_url = img_url.replace(/\/s32-c\//g , '/s2048/');
                img_array.push(img_url);
            }
            //外部画像参照URLを登録する
            GM_setValue(IMG_LIST_ARRAY,img_array);
            FF14.setImgDataURL();
        }
        
        var global = {
            
            /**
             * Google APIの関連処理の初期処理
             */
            init: function() {
                //コールバック関数のためにPostMessageイベントを登録
                $(window).on('message', callPostMessageFunction);
                //GooglePickerを使うための関数をページに出力する
                $('<script>')
                    .attr('src', 'https://cdn.rawgit.com/NohohonNohon/ff14ExternalScript/master/GooglePicker.js')
                    .appendTo('head');
                //スクリプト読み込み後SCRIPT_LOAD_MSGがPostMessageされる
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
            dialog(
                    'コンフィグ',
                    { width: 600, height: 230 },
                    section(
                            '画面表示',
                            '画面表示に関する設定をします。',
                            grid(
                                select('外部画像URL入力欄を非表示にする', 'hidden_input', hidden_input, '非表示にする'), '\n',
                                select('URL登録と同時にアップロード', 'upload_auto', upload_auto, 'アップロードしない')
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
    }
    //メイン関数の呼び出し
    main();
})(jQuery);