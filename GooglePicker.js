var API_KEY = 'AIzaSyAqsQs8Saz2cWjL5zXvIw3UeTX38MUDbYs';
var CLIENT_ID = '240421965790-adpmb77subvkj231pt3dvolnicjmqfhg.apps.googleusercontent.com';
var SCOPE = ['https://www.googleapis.com/auth/photos'];

var oauthToken = undefined;
var pickerApiLoaded = false;

/** 
* Google Picker APIのロード後初期処理
*/
function loadAPI() {
    console.log('loadAPI');
    gapi.load('auth', {'callback': loadAuthApi(true)});
    gapi.load('picker', {'callback': loadPickerApi});
}

/** 
* Picker API認証処理
*/
function loadAuthApi(immediate) {
    console.log('onAuthApiLoad');
    console.log('CLIENT_ID' + CLIENT_ID);
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
    console.log('handleAuthResult');
    if (authResult && !authResult.error) {
        oauthToken = authResult.access_token;
    } else {
        console.log('error:' +  authResult.error);
    }
    console.log(oauthToken);
}

/** 
* Picker API読み込み処理
*/
function loadPickerApi() {
    console.log('onPickerApiLoad');
    pickerApiLoaded = true;
}

/** 
* 画像選択画面のコールバック関数
*/
function pickerCallback(data) {
    var url = 'nothing';
    if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
        var doc = data[google.picker.Response.DOCUMENTS][0];
        url = doc[google.picker.Document.URL];
    }
    var message = 'You picked: ' + url;
    console.log(message);
}

/** 
* 画像選択画面を表示する
*/
function createPicker() {
    console.log('createPicker');
    console.log('pickerApiLoaded'+pickerApiLoaded);
    console.log('oauthToken'+oauthToken);
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