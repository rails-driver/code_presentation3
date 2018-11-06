# frozen_string_literal: true

class Admin::InnovationCallsController < Admin::BaseController
  before_action :set_innovation_call, except: %i[index new create]
  before_action :authorize_innovation_call_scope

  def index
    authorize InnovationCall, :manage?
    @innovation_calls = InnovationCall.all
  end

  def new
    @innovation_call = InnovationCall.new
    authorize @innovation_call, :manage?
  end

  def edit; end

  def create
    @workspace = Workspace.find(params[:workspace_id])
    authorize InnovationCall, :manage?
    @innovation_call = @workspace.build_innovation_call(innovation_call_params)

    if @innovation_call.save
      flash[:success] = t('admin.success.created', entity_name: @innovation_call.class.name)
      redirect_to admin_workspaces_path
    else
      render 'new'
    end
  end

  def update
    authorize InnovationCall, :manage?
    if @innovation_call.update(innovation_call_params)
      flash[:success] = t('admin.success.updated', entity_name: @innovation_call.class.name)
      redirect_to admin_workspaces_path
    else
      render 'edit'
    end
  end

  def destroy
    authorize InnovationCall, :manage?
    if @innovation_call.destroy
      flash[:success] = t('admin.success.deleted', entity_name: @innovation_call.class.name)
    else
      flash[:alert] = @innovation_call.errors.full_messages.join('. ')
    end
    redirect_to admin_workspace_path
  end

  private

  def set_innovation_call
    @innovation_call = InnovationCall.find(params[:id])
    authorize @innovation_call, :manage?
  end

  def innovation_call_params
    params.require(:innovation_call).permit(:name, :content, :start_date, :end_date)
  end

  def authorize_innovation_call_scope
    policy_scope(InnovationCall)
  end
end
