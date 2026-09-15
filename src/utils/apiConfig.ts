const devApiUrl = import.meta.env.VITE_API_URL;

export const url = window.location.hostname;
let prodApiUrl = ''

if(url == "chorapp.wald.pro") {
  prodApiUrl = "https://chorappserver.wald.pro"
}

export const apiUrl: string | undefined = import.meta.env.DEV
  ? devApiUrl
  : prodApiUrl;