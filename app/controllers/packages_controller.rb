class PackagesController < ApplicationController
    before_action :set_package, only: %i[show edit update destroy]
  
    def index
      @packages = Package.all
    end
  
    def new
      @package = Package.new
      @flights = Flight.all # To allow selection of flights for the package
    end
  
    def create
      @package = Package.new(package_params)
  
      if @package.save
        redirect_to @package, notice: 'Package was successfully created.'
      else
        render :new
      end
    end
  
    def edit
      @flights = Flight.all
    end
  
    def update
      if @package.update(package_params)
        redirect_to @package, notice: 'Package was successfully updated.'
      else
        render :edit
      end
    end
  
    def destroy
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
  