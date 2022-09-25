include ./.env
SHELL := /bin/bash
BUILD_FLAGS=--no-cache --force-rm
FG_BLK:=$(shell tput setaf 0)
FG_RED:=$(shell tput setaf 1)
FG_GRN:=$(shell tput setaf 2)
FG_YEL:=$(shell tput setaf 3)
FG_BLU:=$(shell tput setaf 4)
FG_MAG:=$(shell tput setaf 5)
FG_CYA:=$(shell tput setaf 6)
FG_WHT:=$(shell tput setaf 7)
BG_BLK:=$(shell tput setab 0)
BG_RED:=$(shell tput setab 1)
BG_GRN:=$(shell tput setab 2)
BG_YEL:=$(shell tput setab 3)
BG_BLU:=$(shell tput setab 4)
BG_MAG:=$(shell tput setab 5)
BG_CYA:=$(shell tput setab 6)
BG_WHT:=$(shell tput setab 7)
BOLD:=$(shell tput bold)
SGR0 := $(shell tput sgr0)

.PHONY:
build:
	docker-compose build $(BUILD_FLAGS)

dev:
	@printf '$(BOLD)$(FG_GRN)Run in development mode.$(SGR0)\n' && \
	docker-compose run -p 8000:8000 -e NODE_ENV=development node npm run build && \
	printf '$(BOLD)$(FG_GRN)done.$(SGR0)' && echo

prod:
	@printf '$(BOLD)$(FG_GRN)Build in production mode ... $(SGR0)\n' && \
	docker-compose run -e NODE_ENV=production node npm run build && \
	printf '$(BOLD)$(FG_GRN)done.$(SGR0)' && echo

init:
	@printf '$(BOLD)$(FG_GRN)Init Project ... $(SGR0)\n' && \
	$(MAKE) -s clean-src && \
	docker-compose run -u node node npm init -y && \
	$(MAKE) -s install-dev i=$(DEV_DEPENDENCIES) && \
	docker-compose run -u node node ./node_modules/.bin/json -I -f package.json -e "this.type=\"module\"" && \
	docker-compose run -u node node ./node_modules/.bin/json -I -f package.json -e "this.scripts.build=\"node ./esbuild.js\"" && \
	docker-compose run -u node node ./node_modules/.bin/json -I -f package.json -e "delete this.scripts.test" && \
	printf '$(BOLD)$(FG_GRN)done.$(SGR0)\n'

install:
	@printf '$(BOLD)$(FG_GRN)Installing package$(SGR0) $(i) ... \n' && \
	docker-compose run -u node node npm i $(i)	&& \
	printf '$(BOLD)$(FG_GRN)done.$(SGR0)\n'

install-dev:
	@printf '$(BOLD)$(FG_GRN)Installing dev dependency:$(SGR0) $(i) ... \n' && \
	docker-compose run -u node node npm -D i $(i)	&& \
	printf '$(BOLD)$(FG_GRN)done.$(SGR0)\n'

clean-src:
	@printf '$(BOLD)$(FG_RED)Cleanup src ...$(SGR0)\n' && \
	read -p 'Sure? (y/n)' -s -n 1 -r  && \
	if [ "_$$REPLY" = "_y" ]; then \
		rm -rf ./src/node_modules ./src/package.json ./src/package-lock.json && \
		printf '\n$(BOLD)$(FG_GRN)... done.$(SGR0)\n'; \
	else \
		printf '\n$(BOLD)$(FG_RED)... aborted.$(SGR0)\n'; \
	fi

clean-logs:
	@printf '$(BOLD)$(FG_RED)Cleanup logs ...$(SGR0)\n' && \
	read -p 'Sure? (y/n)' -s -n 1 -r  && \
	if [ "_$$REPLY" = "_y" ]; then \
		rm -rf ./logs/npm/* && \
		printf '\n$(BOLD)$(FG_GRN)... done.$(SGR0)\n'; \
	else \
		printf '\n$(BOLD)$(FG_RED)... aborted.$(SGR0)\n'; \
	fi

clean-static:
	@printf '$(BOLD)$(FG_RED)Cleanup static files ...$(SGR0)\n' && \
	read -p 'Sure? (y/n)' -s -n 1 -r  && \
	if [ "_$$REPLY" = "_y" ]; then \
		rm -rf ./public/static/* && \
		printf '\n$(BOLD)$(FG_GRN)... done.$(SGR0)\n'; \
	else \
		printf '\n$(BOLD)$(FG_RED)... aborted.$(SGR0)\n'; \
	fi

ifndef VERBOSE
.SILENT:
endif
.DEFAULT_GOAL := dev