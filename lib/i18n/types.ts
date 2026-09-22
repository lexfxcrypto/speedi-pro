/** The same keys as the English, every value a string. */
export type Strings<T> = { [K in keyof T]: string };
