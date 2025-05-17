// src/page/authConfig.ts
import { LogLevel } from "@azure/msal-browser";

export const msalWebConfig = {
  auth: {
    clientId: "your-client-id", // Replace with your client ID
    authority: "your-authority", // Replace with your authority
    redirectUri: "http://localhost:8081",
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: any, message: any, containsPii: any) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message); break;
          case LogLevel.Info:
            console.info(message); break;
          case LogLevel.Verbose:
            console.debug(message); break;
          case LogLevel.Warning:
            console.warn(message); break;
        }
      },
    },
  },
};

export const mobileAuthConfig = {
  issuer: 'your-issuer', // Replace with your issuer
  clientId: 'your-client-id', // Replace with your client ID
  redirectUrl: 'your-redirect-url', // Replace with your redirect URL
  scopes: ['openid', 'profile', 'User.Read', 'email'],
  serviceConfiguration: {
    authorizationEndpoint: 'your-authorization-endpoint', // Replace with your authorization endpoint
    tokenEndpoint: 'your-token-endpoint', // Replace with your token endpoint
    revocationEndpoint: 'your-revocation-endpoint', // Replace with your revocation endpoint
  },
};
