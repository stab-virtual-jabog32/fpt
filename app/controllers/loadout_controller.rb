class LoadoutController < ApplicationController
  before_action :set_flight

  def edit
    Rails.logger.debug("Entering LoadoutController#edit for flight #{@flight.id}")
  
    @loadout = Loadout.parse(@flight.airframe, @flight.loadout || '') # Handle case where loadout is nil
    @stations = Settings.loadout.send(@flight.airframe).map { |config| Station.new(config) }
  
    # Fetch templates if they exist for this airframe
    @templates = LoadoutTemplate.where(airframe: @flight.airframe)
  
    Rails.logger.debug("Loadout and stations loaded successfully.")
  end

  # Update the loadout for the flight
  def update
    @loadout = Loadout.new(@flight.airframe, loadout_params)
    @flight.update(loadout: @loadout)
    redirect_to flight_path(@flight)
    Rails.logger.debug("Request format: #{request.format}")
  end

# Save the current loadout as a template
def save_template
  template_name = params[:template_name]

  # Directly capture the loadout data from the form without serializing
  loadout_data = @flight.loadout

  # Save the template with the loadout string
  LoadoutTemplate.create!(
    name: template_name,
    airframe: @flight.airframe,
    loadout: loadout_data
  )

  redirect_to flight_path(@flight)
end


# Load a template into the current flight's loadout
def load_template
  # Fetch the loadout template by its ID
  template = LoadoutTemplate.find(params[:template_id])

  # Directly update the flight's loadout with the template's loadout data
  @flight.update(loadout: template.loadout)

  # Redirect back to the loadout edit page with a success message
  redirect_to flight_path(@flight)
  Rails.logger.debug("Request format: #{request.format}")
end



  private

  def set_flight
    @flight = Flight.find(params[:flight_id])
  end

  def loadout_params
    params.require(:loadout).permit(Settings.loadout.send(@flight.airframe).keys + %w[f e g])
  end
  
end
