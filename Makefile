.PHONY: install dev build build-dir build-github type-check lint lint-fix clean help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	pnpm install

dev: ## Start development mode with HMR
	pnpm dev

build: ## Build and package for distribution
	pnpm build

build-dir: ## Build without packaging (unpacked directory)
	pnpm build:dir

build-github: ## Build bundles only (no electron-builder packaging)
	pnpm build:github

type-check: ## Run TypeScript type checking
	pnpm type-check

lint: ## Run ESLint
	pnpm lint

lint-fix: ## Run ESLint with auto-fix
	pnpm lint:fix

clean: ## Remove build artifacts
	rm -rf dist release node_modules/.cache
