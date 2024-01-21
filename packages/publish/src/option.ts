import { MessageKey, XiuError } from './error/xiu-error'

export interface CmdOptions {
	otp?: boolean
	commit?: boolean
	space?: string
	build?: boolean
	hook?: string
	registry?: string
	network?: boolean
}

export interface PackageInfo {
	path: string
	name: string
	v: string
	description: string
	luo?: boolean
}

export interface XiuContext extends CmdOptions {
	cwdPath: string
	registry: string
	updatedVersion: boolean
	networkSuccess: boolean
	pkgJson: string
	pkg?: PackageInfo
	printError: (error: XiuError) => void
	loading: (msg: string, time: number, errorCode: MessageKey) => () => void
}

export type XiuFn = () => Promise<void>

export type XiuHandler = (context: XiuContext, next: XiuFn) => Promise<void>
