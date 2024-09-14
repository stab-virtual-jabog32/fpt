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
  end

# Save the current loadout as a template
def save_template
  template_name = params[:template_name]
  
  # Initialize the Loadout object with current loadout parameters
  loadout = Loadout.new(@flight.airframe, loadout_params)

  # Serialize the loadout into a JSON format for full data capture
  serialized_loadout = {
    stations: loadout.stations,
    gun: {
      amount: loadout.gun_amount,
      type: loadout.gun_type
    },
    expendables: loadout.expendables,
    fuel: loadout.fuel
  }.to_json

  # Save the template with the full serialized loadout
  LoadoutTemplate.create!(name: template_name, airframe: @flight.airframe, loadout: serialized_loadout)

  redirect_to edit_flight_loadout_path(@flight), notice: 'Template saved successfully.'
end


  # Load a template into the current flight's loadout
# Load a template into the current flight's loadout
def load_template
  template = LoadoutTemplate.find(params[:template_id])

  # Parse the serialized loadout from the template
  parsed_loadout = JSON.parse(template.loadout, symbolize_names: true)

  # Create a new Loadout object from the parsed data
  loadout = Loadout.new(@flight.airframe)
  loadout.stations = parsed_loadout[:stations]
  loadout.gun_amount = parsed_loadout.dig(:gun, :amount)
  loadout.gun_type = parsed_loadout.dig(:gun, :type)
  loadout.expendables = parsed_loadout[:expendables]
  loadout.fuel = parsed_loadout[:fuel]

  # Save the flight's loadout with the updated values
  @flight.update!(loadout: loadout.to_s)

  redirect_to edit_flight_loadout_path(@flight), notice: 'Template loaded successfully.'
  Rails.logger.debug("Loaded template: #{template.loadout}")
  Rails.logger.debug("Updated flight loadout: #{loadout.to_s}")
end


  private

  def set_flight
    @flight = Flight.find(params[:flight_id])
  end

  def loadout_params
    params.require(:loadout).permit(Settings.loadout.send(@flight.airframe).keys + %w[f e g gun_amount gun_type])
  end
end
