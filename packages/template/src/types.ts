type TemplateKey = keyof TemplateMap
export type Kind = TemplateKey extends never ? any : TemplateKey
export type Config<T extends Kind> = T extends TemplateKey
	? TemplateMap[T]
	: any

export interface TemplateMap {}
