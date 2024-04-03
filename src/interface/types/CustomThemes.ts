export type CustomTheme = {
  id: string;
  name: string;
  description: string;
  defaultColour: string;
  CanChangeColour: boolean;
  CustomCSS: string;
  CustomImages: CustomImage[];
}

export type CustomImage = {
  id: string;
  blob: Blob;
  variableName: string;
}

export type CustomImageBase64 = {
  id: string;
  url: string;
  variableName: string;
}

export type CustomThemeBase64 = Omit<CustomTheme, 'CustomImages'> & {
  CustomImages: CustomImageBase64[];
}

export type ThemeList = {
  themes: Omit<CustomTheme, 'CustomImages'>[];
  selectedTheme: string;
}