class LoadoutController < ApplicationController
  before_action :set_flight

  def edit
    @loadout = Loadout.parse(@flight.airframe, @flight.loadout || '') # Handle case where loadout is nil
    @stations = Settings.loadout.send(@flight.airframe).map { |config| Station.new(config) }
  
    # Fetch templates if they exist for this airframe
    @templates = LoadoutTemplate.where(airframe: @flight.airframe)
  end

  # Update the loadout for the flight
  def update
    @loadout = Loadout.new(@flight.airframe, loadout_params)
    @flight.update(loadout: @loadout)
    redirect_to flight_path(@flight)
  end

# Save the current loadout as a template
def save_template
  template_name = params[:template][:template_name]
  loadout_data = params[:template][:loadout]

  # Ensure that all stations are present, even if they are empty
  all_stations = (1..9).map { |i| [i.to_s, loadout_data[i.to_s] || ""] }.to_h

  # Serialize the loadout, including gun, fuel, and expendables
  serialized_loadout = all_stations.map { |station, payload| "#{station}:#{payload}" unless payload.blank? }.compact.join(" ")
  serialized_loadout += " f:#{loadout_data['f']} e:#{loadout_data['e']} g:#{loadout_data['g']}"

  # Save the template with the serialized loadout string
  LoadoutTemplate.create!(
    name: template_name,
    airframe: @flight.airframe,
    loadout: serialized_loadout
  )

  redirect_to flight_path(@flight), notice: 'Template saved successfully.'
end



# Load a template
def load_template
  # Fetch the loadout template by its ID from the nested params
  template = LoadoutTemplate.find(params[:template][:template_name])

  # Directly update the flight's loadout with the template's loadout data
  @flight.update(loadout: template.loadout)

  # Redirect back to the flight page with a success message
  redirect_to flight_path(@flight), notice: 'Template loaded successfully.'
end



  private

  def set_flight
    @flight = Flight.find(params[:flight_id])
  end

  def loadout_params
    params.require(:loadout).permit(Settings.loadout.send(@flight.airframe).keys + %w[f e g])
  end
  
end
