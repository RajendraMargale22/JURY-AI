/// <reference types="vite/client" />

declare namespace NodeJS {
	interface ProcessEnv {
		REACT_APP_API_URL?: string;
		REACT_APP_FIREBASE_API_KEY?: string;
		REACT_APP_FIREBASE_AUTH_DOMAIN?: string;
		REACT_APP_FIREBASE_PROJECT_ID?: string;
		REACT_APP_FIREBASE_APP_ID?: string;
		REACT_APP_FIREBASE_MESSAGING_SENDER_ID?: string;
		REACT_APP_CONTRACT_REVIEW_API_URL?: string;
		REACT_APP_CONTRACT_REVIEW_API_KEY?: string;
		REACT_APP_CHATBOT_API_URL?: string;
		REACT_APP_NEWS_API_KEY?: string;
	}
}

declare const process: {
	env: NodeJS.ProcessEnv;
};
