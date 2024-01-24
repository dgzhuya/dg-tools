export type Kind = keyof TemplateMap
export type Config<T extends Kind> = TemplateMap[T]

export interface TemplateMap {}
