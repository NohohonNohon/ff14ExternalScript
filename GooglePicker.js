//==================================================
/** GooglePicker APIの関連処理 */
//==================================================
var GooglePicker = (function() {
    
    var SCRIPT_LOAD_MSG = 'GOOGLE_PICKER_SCRIPT_LOAD';
    var PICKED_IMAGE_MSG = 'GOOGLE_PICKER_PICKED_IMAGE';
    
    var API_KEY = 'AIzaSyAqsQs8Saz2cWjL5zXvIw3UeTX38MUDbYs';
    var CLIENT_ID = '240421965790-adpmb77subvkj231pt3dvolnicjmqfhg.apps.googleusercontent.com';
    var SCOPE = ['https://www.googleapis.com/auth/photos'];
    var TARGET_URL = location.protocol + '//' + location.hostname;

    var pickerApiLoaded = false;
    
    /** 
    * Picker API認証処理
    */
    function authorizeApi(immediate, callback) {
        gapi.auth.authorize(
            {
                'client_id': CLIENT_ID,
                'scope': SCOPE,
                'immediate': immediate
            },
        callback);
    }

    /** 
    * Picker API読み込み処理完了
    */
    function onloadPickerApi() {
        pickerApiLoaded = true;
    }

    /** 
    * 画像選択画面のコールバック関数
    */
    function pickerCallback(data) {
        var url = 'nothing';
        if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
            var doc = data[google.picker.Response.DOCUMENTS];
            //docデータからのURL抜き出し、登録などはメインスクリプトで行う
            window.postMessage([PICKED_IMAGE_MSG,doc], TARGET_URL);
        }
    }

    /** 
    * 画像選択画面を表示する
    */
    function createPicker() {
        var token = gapi.auth.getToken();
        if (pickerApiLoaded && token) {
            var accessToken = gapi.auth.getToken().access_token;
            var picker = new google.picker.PickerBuilder()
                .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
                .addView(google.picker.ViewId.PHOTOS)
                .addView(new google.picker.PhotosView().setType('camerasync'))
                .addView(google.picker.ViewId.PHOTO_UPLOAD)
                .setLocale('ja')
                .setCallback(pickerCallback)
                .setOAuthToken(accessToken)
                .setDeveloperKey(API_KEY)
                .build();
            picker.setVisible(true);
            
            //画像選択画面のz-indexを画像アップロード画面よりも前に設定
            $('.picker-dialog-bg').css('z-index', '10009');
            $('.picker-dialog').css('z-index', '10010');
        } else {
            //認証ダイアログを表示する
            authorizeApi(true,createPicker);
        }
    }
    var global = {
        
        /**
         * Google APIの関連処理の初期処理
         */
        initGoogleAPI: function() {
            gapi.load('auth', {'callback': authorizeApi(true)});
            gapi.load('picker', {'callback': onloadPickerApi});
            $('#embedfiles').on('click',createPicker);
        },
        
        /**
         * スクリプトロード完了通知
         */
        sendLoadComplete: function() {
            window.postMessage([SCRIPT_LOAD_MSG,''], TARGET_URL);
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

//スクリプトロード完了
GooglePicker.sendLoadComplete();
