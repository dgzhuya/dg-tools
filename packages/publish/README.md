# @biuxiu/publish
> 一个npm发布工具,帮助发布npm包信息,能够自动设置发布信息等功能

## 使用说明
### 一、安装
```sh
pnpm add -D @biuxiu/publish
```

### 二、使用方式
1. 查看版本信息
```sh
# 查看版本信息
pnpm xiu -V
```
2. 查看命令提示
```sh
# 查看帮助信息
pnpm xiu -h
```
4. 配置Npm脚本命令
```json
{
  "scripts": {
		"publish": "xiu -o -w packages -c"
	},
}
```
### 三、参数说明

|          | 参数 | 完整参数 | 参数类型 | 参数说明                   | 示例          | 默认值 |
| -------- | ---- | -------- | -------- | -------------------------- | ------------- | ------ |
| 发布验证 | -o   | --otp    | bool     | 传递npm publish 认证信息   |               | false  |
| 工作空间 | -s   | --space  | string   | 设置在Monorepo项目中包目录 | packages      |
| git提交  | -c   | --commit | string   | 设置是否提交commit         |               | false  |
| hook     | -h   | --hook   | string   | 设置是否在发布前编译项目   | npm run build |        |
| 打包     | -b   | --build  | bool     | 设置是否在发布前编译项目   |               | false  |
