class LoadoutController < ApplicationController
  before_action :set_flight

  # Edit loadout for the flight
  def edit
    Rails.logger.debug("Entering LoadoutController#edit for flight #{@flight.id}")
    if @flight.loadout.present?
      Rails.logger.debug("Flight #{@flight.id} has a loadout. Parsing loadout...")
      @loadout = Loadout.parse(@flight.airframe, @flight.loadout)
    else
      Rails.logger.debug("Flight #{@flight.id} does not have a loadout. Creating a blank loadout...")
      @loadout = Loadout.new(@flight.airframe) # Create a new blank loadout if none exists
    end

    @stations = Settings.loadout.send(@flight.airframe).map { |config| Station.new(config) }

    # Load any existing templates for this airframe
    @templates = LoadoutTemplate.where(airframe: @flight.airframe)
    Rails.logger.debug("LoadoutController#edit completed for flight #{@flight.id}")
  end

  # Update the loadout for the flight
  def update
    @loadout = Loadout.new(@flight.airframe, loadout_params)
    @flight.update(loadout: @loadout)
    redirect_to flight_path(@flight)
  end

  # Save the current loadout as a template
  def save_template
    template_name = params[:template_name]
    loadout = Loadout.new(@flight.airframe, loadout_params)
    LoadoutTemplate.create(name: template_name, airframe: @flight.airframe, loadout: loadout.to_s) # Store loadout as a string

    redirect_to edit_flight_loadout_path(@flight), notice: 'Template saved successfully.'
  end

  # Load a template into the current flight's loadout
  def load_template
    template = LoadoutTemplate.find(params[:template_id])
    @flight.update(loadout: template.loadout)

    redirect_to edit_flight_loadout_path(@flight), notice: 'Template loaded successfully.'
  end

  private

  def set_flight
    @flight = Flight.find(params[:flight_id])
  end

  def loadout_params
    params.require(:loadout).permit(Settings.loadout.send(@flight.airframe).keys + %w[f e g])
  end
end
