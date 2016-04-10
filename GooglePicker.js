//==================================================
/** GooglePicker APIの関連処理 */
//==================================================
var GooglePicker = (function() {
    
    var SCRIPT_LOAD_MSG = 'GOOGLE_PICKER_SCRIPT_LOAD';
    var PICKED_IMAGE_MSG = 'GOOGLE_PICKER_PICKED_IMAGE';
    
    var API_KEY = 'AIzaSyAqsQs8Saz2cWjL5zXvIw3UeTX38MUDbYs';
    var CLIENT_ID = '240421965790-adpmb77subvkj231pt3dvolnicjmqfhg.apps.googleusercontent.com';
    var SCOPE = ['https://www.googleapis.com/auth/photos'];

    var oauthToken = undefined;
    var pickerApiLoaded = false;
    
    /** 
    * Picker API認証処理
    */
    function loadAuthApi(immediate) {
        gapi.auth.authorize(
            {
                'client_id': CLIENT_ID,
                'scope': SCOPE,
                'immediate': immediate
            },
        handleAuthResult);
    }

    /** 
    * Picker API認証終了処理
    * @param {auth} 認証情報
    */
    function handleAuthResult(authResult) {
        if (authResult && !authResult.error) {
            oauthToken = authResult.access_token;
        }
    }

    /** 
    * Picker API読み込み処理
    */
    function loadPickerApi() {
        pickerApiLoaded = true;
    }

    /** 
    * 画像選択画面のコールバック関数
    */
    function pickerCallback(data) {
        var url = 'nothing';
        if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
            var doc = data[google.picker.Response.DOCUMENTS];
            console.log(doc);
            window.postMessage([PICKED_IMAGE_MSG,doc], 'http://jp.finalfantasyxiv.com');
        }
    }

    /** 
    * 画像選択画面を表示する
    */
    function createPicker() {
        if (pickerApiLoaded && oauthToken) {
            var picker = new google.picker.PickerBuilder()
                .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
                .addView(google.picker.ViewId.PHOTOS)
                .addView(new google.picker.PhotosView().setType('camerasync'))
                .addView(google.picker.ViewId.PHOTO_UPLOAD)
                .setLocale('ja')
                .setCallback(pickerCallback)
                .setOAuthToken(oauthToken)
                .setDeveloperKey(API_KEY)
                .build();
            picker.setVisible(true);
            
            //画像選択画面のz-indexを画像アップロード画面よりも前に設定
            $('.picker-dialog-bg').css('z-index', '10009');
            $('.picker-dialog').css('z-index', '10010');
        } else {
            //認証ダイアログを表示する
            loadAuthApi(false);
        }
    }
    var global = {
        
        /**
         * Google APIの関連処理の初期処理
         */
        initGoogleAPI: function() {
            gapi.load('auth', {'callback': loadAuthApi(true)});
            gapi.load('picker', {'callback': loadPickerApi});
            $('#embedfiles').on('click',createPicker);
        },
        
        /**
         * スクリプトロード完了通知
         */
        sendLoadComplete: function() {
            window.postMessage([SCRIPT_LOAD_MSG,''], 'http://jp.finalfantasyxiv.com');
        }
    };
    return global;
})();

/** 
* Google Picker APIのロード後初期処理呼び出し
*/
function onLoadGoogleAPI() {
    GooglePicker.initGoogleAPI();
}

GooglePicker.sendLoadComplete();