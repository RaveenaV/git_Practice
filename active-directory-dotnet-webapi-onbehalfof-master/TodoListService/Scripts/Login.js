(function () {
	'use strict';
	// Helpers ---- Start
	var checkIsRefresh;
	function redirector() {
		localStorage.setItem('loginInProgress', false);

		var isRefresh = localStorage.getItem('isRefresh');
		if (isRefresh && 'true'.indexOf(isRefresh) === 0) {
			return;
		}
		if (checkIsRefresh)
			clearInterval(checkIsRefresh);
		var redirectUri = localStorage.getItem('redirectUri');
		var redirectTo = localStorage.getItem('afterLoginRedirectTo');
		if (!redirectTo || redirectTo === '') {
			window.location.replace(redirectUri);
		}
		else {
			window.location.replace(redirectTo);
		}
	}
	// Helpers ---- End

	// AAD functions ---- End
	function acquireAadToken(aapConfig, clientApplication) {
		clientApplication.acquireToken(appConfig.aadClientId,
			function (error, token) {
				if (error || !token) {
					console.log("ADAL error occurred: " + error);
					var err = {};
					err['statusText'] = error;
					loginWithAad(appConfig, true);
					return;
				}
				else {
					localStorage.setItem('accessToken', token);
					redirector();
				}
			});
	}
	function logoutAad(appConfig) {
		localStorage.clear();
		window.location.replace(appConfig.aadLogoutUri);
	}
	function getTenantConfig(appConfig) {
		return {
			tenant: appConfig.aadTenant,
			clientId: appConfig.aadClientId,
			redirectUri: appConfig.redirectUri,
			cacheLocation: 'localStorage'
		};
	}
	function checkAndLoginAadCachedUser(appConfig) {
		var adalError = localStorage.getItem('adal.error');
		if (adalError && 'login_required'.indexOf(adalError) === 0) {
			loginWithAad(appConfig, true);
			return;
		}
		var clientApplication = new AuthenticationContext(getTenantConfig(appConfig));
		clientApplication.handleWindowCallback();
		var user = clientApplication.getCachedUser();
		if (user) {
			acquireAadToken(appConfig, clientApplication);
		}
		else {
			loginWithAad(appConfig);
		}
	}
	function loginWithAad(appConfig, force) {
		var accessToken = localStorage.getItem('accessToken');
		if (accessToken)
			return;
		var clientApplication = new AuthenticationContext(getTenantConfig(appConfig));
		clientApplication.handleWindowCallback();
		var user = clientApplication.getCachedUser();
		if (!user || force) {
			localStorage.setItem('loginInProgress', true);
			clientApplication.login();
		}
		else {
			acquireAadToken(appConfig, clientApplication);
		}
	}
	// AAD functions ---- End

	// Init ---- Start
	$(document).ready(function () {

		var accessToken = undefined;
		var appConfig = window.appConfig;

		if ('logout'.indexOf(appConfig.intent) === 0) {
			logoutAad(appConfig);
			return;
		}

		var redirectUri = appConfig.appUri + "home";
		var loginUri = appConfig.appUri + 'login';

		localStorage.setItem('redirectUri', redirectUri);
		localStorage.setItem('adal.login.request', loginUri);

		if (appConfig.isRefresh) {
			localStorage.setItem('isRefresh', appConfig.isRefresh);
		}

		var nocache = localStorage.getItem('nocache');
		if (nocache) {
			nocache = false;
			localStorage.removeItem('nocache');
		}
		else if (appConfig.nocache) {
			nocache = true;
			localStorage.setItem('nocache', true);
		}
		else
			nocache = false;

		if (nocache) {
			localStorage.clear();
		}

		checkIsRefresh = setInterval(function () {
			var isRefresh = localStorage.getItem('isRefresh');
			if (isRefresh && 'true'.indexOf(isRefresh) === 0) {
				localStorage.setItem('isRefresh', false);
			}
		}, 10000);

		setInterval(function () {
			var loginInProgress = localStorage.getItem('loginInProgress');
			accessToken = localStorage.getItem('accessToken');

			if (accessToken) {
				redirector();
			}
			else if (!loginInProgress || (loginInProgress && 'false'.indexOf(loginInProgress) === 0)) {
				checkAndLoginAadCachedUser(appConfig);
			}
			else {
				loginWithAad(appConfig);
			}
		}, 3000);
	});
	// Init ---- End
}());

