module Api
  module V2
    class OffersController < ::Api::V2::ApplicationController
      before_action :doorkeeper_authorize!, except: :global_offer
      around_action :select_slave_shard, except: :redeem

      def index
        offers_dto = Offers::OfferService.new.available_for_user_offers(user_id: current_user.id)

        return render json: [] if offers_dto.empty?

        offers_presenters = offers_dto.map do |offer_dto|
          Api::V2::Presenters::Offers::Offer.new(dto: offer_dto).present
        end
        render json: offers_presenters
      end

      def show
        offer_dto = Offers::OfferService.new.available_for_user_offers(params[:id], user_id: current_user.id).first

        return render json: {}, status: :no_content  if offer_dto.blank?

        render json: Api::V2::Presenters::Offers::Offer.new(dto: offer_dto).present(type: :details), status: :ok
      end

      def available_for_restaurant
        available = Offers::OfferService.new.available_for_restaurant?(
          offer_id: params[:id], restaurant_id: params[:restaurant_id]
        )
        render json: {available_for_subject: available}
      end

      def available_for_country
        available = Offers::OfferService.new.available_for_country?(offer_id: params[:id], country_id: params[:country_id])
        render json: {available_for_subject: available}
      end

      def global_offer
        offer_dto = Offers::OfferService.new.available_for_restaurant(restaurant_id: params[:restaurant_id])
        return render json: {} unless offer_dto

        render json: Api::V2::Presenters::Offers::Offer.new(dto: offer_dto).present(type: :global), status: :ok
      end

      def check_with_coupon
        coupon = Coupon.where(code: params[:coupon]).first
        offer_dto = Offers::OfferService.new.fetch_by_id(id: coupon.offer.id) if coupon&.offer
        return render json: {}, status: :no_content if offer_dto.blank? ||
          !Offers::OfferService.new.available_for_user?(id: offer_dto.id, user_id: current_user.id)

        render json: Api::V2::Presenters::Offers::Offer.new(dto: offer_dto).present(type: :details), status: :ok
      end

      def redeem
        result = Offers::RedeemChargeOffer.start(coupon_id: params[:coupon], user_id: current_user.id)
        return render_api_error errors: result[:errors] if result[:has_error]

        render json: {message: result[:message]}, status: :accepted
      end
    end
  end
end
