export interface PublishOption {
    otp?: boolean
    commit?: boolean
    work?: string
}

export interface PackageInfo {
    path: string
    name: string
    v: string
    description: string
    luo?: boolean
}
