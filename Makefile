UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Darwin)
    SED := $(shell command -v gsed 2>/dev/null)
    ifeq ($(SED),)
        $(error GNU sed (gsed) not found on macOS. \
			Install with: brew install gnu-sed)
    endif
else
    SED := sed
endif

.PHONY: help
help: ## Ask for help!
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; \
		{printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: setup
setup: ## Setup development environment
	npm install

.PHONY: dev
dev: ## Start development server
	npm run dev

.PHONY: build
build: ## Build the project in debug mode
	npm run build

.PHONY: build-release
build-release: ## Build the project in release mode
	npm run build

.PHONY: check
check: ## Check code for compilation errors
	npm run check

.PHONY: check-format
check-format: ## Check code formatting
	npm run lint

.PHONY: format
format: ## Format code
	npm run format

.PHONY: lint
lint: ## Run linter
	npm run lint

.PHONY: lint-shell
lint-shell: ## Lint shell scripts with shellcheck
	@echo "Linting shell scripts..."
	@find . -name "*.sh" \
		-not -path "./node_modules/*" \
		-not -path "./.git/*" \
		-print0 | xargs -0 shellcheck
	@echo "Shell scripts OK"

.PHONY: deploy
deploy: ## Deploy to Cloudflare Pages
	./deploy/deploy.sh

.PHONY: deploy-preview
deploy-preview: ## Deploy preview to Cloudflare Pages
	./deploy/deploy.sh preview

.PHONY: test
test: ## Run unit tests
	npm run test

.PHONY: test-e2e
test-e2e: ## Run Playwright E2E tests
	npm run test:e2e

.PHONY: test-e2e-ui
test-e2e-ui: ## Run Playwright tests with interactive UI
	npm run test:e2e:ui

.PHONY: test-e2e-headed
test-e2e-headed: ## Run Playwright tests in headed browser mode
	npm run test:e2e:headed

.PHONY: test-e2e-report
test-e2e-report: ## Show Playwright HTML test report
	npm run test:e2e:report

.PHONY: test-all
test-all: test test-e2e ## Run all tests (unit + E2E)

.PHONY: clean
clean: ## Clean build artifacts
	rm -rf dist build node_modules

.PHONY: check-outdated
check-outdated: ## Check for outdated dependencies
	npm outdated || true

.PHONY: fix-trailing-whitespace
fix-trailing-whitespace: ## Remove trailing whitespaces from all files
	@echo "Removing trailing whitespaces from all files..."
	@find . -type f \( \
		-name "*.rs" -o -name "*.toml" -o -name "*.md" -o -name "*.yaml" \
		-o -name "*.yml" -o -name "*.ts" -o -name "*.tsx" \
		-o -name "*.js" -o -name "*.jsx" -o -name "*.sh" \
		-o -name "*.py" -o -name "*.go" -o -name "*.c" -o -name "*.h" \
		-o -name "*.cpp" -o -name "*.hpp" -o -name "*.json" \
		-o -name "*.scss" \) \
		-not -path "./node_modules/*" \
		-not -path "./.git/*" \
		-not -path "./dist/*" \
		-not -path "./build/*" \
		-exec sh -c \
			'echo "Processing: $$1"; $(SED) -i -e "s/[[:space:]]*$$//" "$$1"' \
			_ {} \; && \
		echo "Trailing whitespaces removed."

.PHONY: check-trailing-whitespace
check-trailing-whitespace: ## Check for trailing whitespaces in source files
	@echo "Checking for trailing whitespaces..."
	@files_with_trailing_ws=$$(find . -type f \( \
		-name "*.rs" -o -name "*.toml" -o -name "*.md" -o -name "*.yaml" \
		-o -name "*.yml" -o -name "*.ts" -o -name "*.tsx" \
		-o -name "*.js" -o -name "*.jsx" -o -name "*.sh" \
		-o -name "*.py" -o -name "*.go" -o -name "*.c" -o -name "*.h" \
		-o -name "*.cpp" -o -name "*.hpp" -o -name "*.json" \
		-o -name "*.scss" \) \
		-not -path "./node_modules/*" \
		-not -path "./.git/*" \
		-not -path "./dist/*" \
		-not -path "./build/*" \
		-exec grep -l '[[:space:]]$$' {} + 2>/dev/null || true); \
	if [ -n "$$files_with_trailing_ws" ]; then \
		echo "Files with trailing whitespaces found:"; \
		echo "$$files_with_trailing_ws" | sed 's/^/  /'; \
		echo ""; \
		echo "Run 'make fix-trailing-whitespace' to fix automatically."; \
		exit 1; \
	else \
		echo "No trailing whitespaces found."; \
	fi
