type TemplateKey = keyof TemplateMap
export type Kind = TemplateKey extends never ? any : TemplateKey
export type Config<T extends Kind> = T extends TemplateKey
	? TemplateMap[T]
	: any

export interface TemplateMap {}

export type RenderFn<T extends string = string> = (
	...val: (T extends `${infer _}Int` ? number : string)[]
) => string

export type RenderPlugin<T extends string = string> = [T, RenderFn<T>]
