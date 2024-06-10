type TemplateKey = keyof TemplateMap
export type Kind = TemplateKey extends never ? unknown : TemplateKey
export type Config<T extends Kind> = T extends TemplateKey
	? TemplateMap[T]
	: unknown

export interface TemplateMap {
	111: string
}
