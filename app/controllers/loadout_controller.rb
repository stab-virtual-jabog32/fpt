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

  # Permit all the required fields dynamically based on the current loadout
  permitted_loadout = loadout_params

  # Creating the Loadout instance using the permitted params
  loadout = Loadout.new(@flight.airframe, permitted_loadout)

  # Serialize the full loadout object
  serialized_loadout = {
    airframe: @flight.airframe,
    stations: loadout.to_h, # Station data
    gun: { amount: loadout[:g] },  # Gun amount
    fuel: loadout[:f],
    expendables: loadout[:e]
  }

  # Save the template as JSON
  LoadoutTemplate.create(
    name: template_name,
    airframe: @flight.airframe,
    loadout: serialized_loadout.to_json
  )

  render json: { message: 'Template saved successfully.' }, status: :ok
end


# Load a template into the current flight's loadout
def load_template
  template = LoadoutTemplate.find(params[:template_id])

  # Deserialize the loadout template JSON
  template_loadout = JSON.parse(template.loadout)

  # Convert the deserialized data back to the flight loadout format
  flight_loadout = template_loadout['stations'].map { |k, v| "#{k}:#{v}" }.join(' ')
  
  # Update the flight’s loadout, not flight attributes directly
  @flight.update(
    loadout: flight_loadout
  )

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
