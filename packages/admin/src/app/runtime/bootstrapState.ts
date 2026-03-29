export type BootstrapState = "setup" | "create" | "login" | "authenticated";

export const getBootstrapState = (_basePath: string): BootstrapState => "create";
