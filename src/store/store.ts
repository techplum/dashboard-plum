import { configureStore } from "@reduxjs/toolkit";
import publicProfileReducer from "./slices/publicProfileSlice";
import orderReducer from "./slices/orderSlice";
import fliiinkerProfileReducer from "./slices/fliiinkerProfileSlice";
import imageReducer from "./slices/imageSlice";
import claimReducer from "./slices/claimSlice";
import messageReducer from "./slices/messageSlice";

// Configuration du store Redux avec les réducteurs importés
export const store = configureStore({
  reducer: {
    publicProfiles: publicProfileReducer, // Ajout du réducteur des profils publics
    orders: orderReducer, // Ajout du réducteur des commandes
    fliiinkerProfiles: fliiinkerProfileReducer, // Ajout du réducteur des profils Fliiinker
    images: imageReducer, // Ajout du réducteur des images
    claims: claimReducer, // Ajout du réducteur des réclamations
    messages: messageReducer, // Ajout du réducteur des messages
  },
});

// Type pour l'état racine du store, basé sur la fonction getState du store
export type RootState = ReturnType<typeof store.getState>;
// Type pour le dispatch du store, basé sur la fonction dispatch du store
export type AppDispatch = typeof store.dispatch;
