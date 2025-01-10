class PackagesController < ApplicationController
  before_action :set_package, only: %i[show edit update destroy]

  def index
    @packages = Package.joins(:flights).where('flights.start > ?', Time.now).distinct
  end

  def new
    @package = Package.new
    @flights = Flight.all # To allow selection of flights for the package
  end

  def create
    @package = Package.new(package_params)
    @flights = Flight.all # Ensure @flights is populated for the view

    if @package.save
      Rails.logger.debug("Package created: #{@package.inspect}")
      redirect_to packages_path, notice: 'Package was successfully created.'
    else
      Rails.logger.debug("Failed to create package: #{@package.errors.full_messages}")
      render :new
    end
  end

  def edit
    @flights = Flight.all
  end

  def update
    @flights = Flight.all # Ensure @flights is populated for the view
    if @package.update(package_params)
      redirect_to @package, notice: 'Package was successfully updated.'
    else
      render :edit
    end
  end

  def destroy
    @package.flights.update_all(package_id: nil) # Unlink all flights from the package
    @package.destroy
    redirect_to packages_url, notice: 'Package was successfully deleted.'
  end

  private

  def set_package
    @package = Package.find(params[:id])
  end

  def package_params
    params.require(:package).permit(:task, :ao, :frequency, :lead_flight_id, flight_ids: [])
  end
end
