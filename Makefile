IMAGE_NAME=chazari/hotel_booking_api
TAG=latest

.PHONY: build push

build:
	docker build -t $(IMAGE_NAME):$(TAG) .

push: build
	docker push $(IMAGE_NAME):$(TAG)
