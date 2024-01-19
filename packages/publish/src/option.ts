export interface XiuOption {
	otp?: boolean
	commit?: boolean
	space?: string
	build?: string
	hook?: boolean
}

export interface PackageInfo {
	path: string
	name: string
	v: string
	description: string
	luo?: boolean
}

export interface XiuContext extends XiuOption {
	cwdPath: string
	pkg?: PackageInfo
}

export type XiuFn = () => Promise<void>

export type XiuHandler = (context: XiuContext, next: XiuFn) => Promise<void>
