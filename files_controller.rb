 
# frozen_string_literal: true

class FilesController < ApplicationController
  include JobTools

  before_action :current_company
  before_action :current_project, only: :create
  before_action :current_folder
  before_action :current_attachments, only: :index
  before_action :current_attachment, only: %i[show edit update destroy]
  before_action :check_permissions, only: %i[archive_files destroy_files move_files share_file]
  respond_to :json

  def index
    render json: @attachments.to_json
  end

  def show
    render json: @attachment.to_json
  end

  def new
    render(:new, layout: !request.xhr?)
  end

  def edit
  end

  def create
    file = current_folder.attachments.new(file: attachment_params[:url],
                                          file_file_name: attachment_params[:name],
                                          author_id: current_user.id)
    respond_to do |format|
      if file.save
        format.html { respond_with(file) }
        format.json do
          render template: 'folders/index', locals: { folders: current_folders.includes(:attachments) }
        end
      end
    end
  end

  def update
    respond_to do |format|
      if current_attachment.update(attachment_params)
        format.html { respond_with(current_attachment) }
        format.json { render json: current_attachment.slice(:id, :name, :url, :folder_id).to_json }
      end
    end
  end

  def destroy
    render json: { status: :ok }.to_json if current_attachment.destroy
  end

  def archive_files
    current_attachments_operation(:archive_files)

    render 'folders/index', locals: { folders: current_folders.includes(:attachments) }
  end

  def download_files
    job_status(params[:job_id]) && return if params[:job_id]
    job_id = CreateProjectFilesArchive.perform_async(current_project.id, current_attachments_general_urls)
    render json: { job_id: job_id }, status: :accepted
  end

  def destroy_files
    current_attachments_operation(:destroy_files)

    render 'folders/index', locals: { folders: current_folders.includes(:attachments) }
  end

  def move_files
    current_attachments_operation(:move_files) if current_folders.where(id: attachment_params[:folder_id]).exists?

    render 'folders/index', locals: { folders: current_folders.includes(:attachments) }
  end

  def share_file
    if attachment_params[:shared].nil?
      current_attachments_operation(:share_files)
    elsif current_project.is_user_admin?(current_user)
      current_project.folders.exported.first.files.update_all(shared: attachment_params[:shared])
    end

    render 'folders/index', locals: { folders: current_folders.includes(:attachments) }
  end

  def rename_file
    current_attachments_operation(:rename_file)

    render 'folders/index', locals: { folders: current_folders.includes(:attachments) }
  end

  def file_image
    render text: ApplicationController.helpers.image_tag(current_attachment.general_url).html_safe
  end

  def file_pdf
    file = current_folder.files.find { |object| object.id == params[:id].to_i }
    file_url = file.general_url
    file_data = open(file_url).read
    file_mime_type = MIME::Types.type_for(file_url).first.to_s
    send_data file_data, type: file_mime_type, disposition: 'inline', filename: file.name
  end

  private

  def check_permissions
    return unless current_project.is_user_admin?(current_user)
  end

  def current_folder
    current_project.folders.find(params[:folder_id])
  end

  def current_attachments
    @current_attachments ||= FileAttachments.perform(attachments: attachment_params[:files],
                                                       folders: current_folders).current_attachments
  end

  def current_attachment
    FilterAttachments.perform(objects: current_objects,
                              user: current_user,
                              company: current_company,
                              folders: current_folders).objects.find(params[:id])
  end

  def current_objects
    case current_folder.typeable
    when 'folder', 'from_clients'
      current_folder.attachments
    when 'spec_attachments'
      current_project.specifications_attachments
    when 'exported'
      current_project.project_document
    end
  end

  def current_attachments_operation(type)
    AttachmentsOperation.perform(attachment_params: attachment_params,
                                 type: type,
                                 user: current_user,
                                 company: current_company,
                                 folders: current_folders,
                                 project: current_project)
  end

  def current_attachments_general_urls
    [current_attachments[:attachments],
     current_attachments[:project_documents],
     current_attachments[:specification_documents]].flatten.map(&:general_url)
  end

  def attachment_params
    params.require(:file).permit(:id, :name, :url, :file_type, :folder_id, :archived, :shared,
                                 files: [:file_object_id, :id, :folder_id, :new_name])
  end
end
