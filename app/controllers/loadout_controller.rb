# app/controllers/loadout_controller.rb
class LoadoutController < ApplicationController
  before_action :set_flight

  def edit
    @loadout = Loadout.parse @flight.airframe, @flight.loadout
    @stations = Settings.loadout.send(@flight.airframe).map { |config| Station.new(config) }
    @templates = LoadoutTemplate.where(airframe: @flight.airframe)
  end

  def update
    @loadout = Loadout.new @flight.airframe, loadout_params
    @flight.update loadout: @loadout
    redirect_to flight_path(@flight)
  end

  def save_template
    template = LoadoutTemplate.new(template_params.merge(airframe: @flight.airframe))
    if template.save
      redirect_to edit_flight_loadout_path(@flight), notice: 'Template saved successfully'
    else
      redirect_to edit_flight_loadout_path(@flight), alert: 'Failed to save template'
    end
  end

  def load_template
    template = LoadoutTemplate.find(params[:template_id])
    @flight.update(loadout: template.loadout)
    redirect_to edit_flight_loadout_path(@flight), notice: 'Template loaded successfully'
  end

  private

  def set_flight
    @flight = Flight.find(params[:flight_id])
  end

  def loadout_params
    params.require(:loadout).permit(Settings.loadout.send(@flight.airframe).keys + %w[f e g])
  end

  def template_params
    params.require(:loadout_template).permit(:name, :loadout)
  end
end
