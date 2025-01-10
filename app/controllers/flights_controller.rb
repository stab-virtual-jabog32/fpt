require 'zip'

class FlightsController < ApplicationController
  before_action :set_flight, only: %i[show edit update destroy print print_images clone waypointsJsonForFlight]

  def index
    set_all_flights if params['all'].present?
    @all = all_flights?
    # Eager load waypoints to avoid N+1 queries and ensure waypoints are available
    @flights = all_flights? ? Flight.includes(:waypoints).all : Flight.includes(:waypoints).current
    min_id = all_flights? ? Flight.offset([Flight.count - 500, 0].max).first.id : 0
    @dates = @flights.where('id >= ?', min_id).select('date(start) as date').order('date').group('date(start)').map(&:date)
  end  

  def show
    @loadout = Loadout.parse @flight.airframe, @flight.loadout
  end
  
  def waypointsJsonForDate
    @flights = Flight.where('date(start) = ?', params[:date]);
    render :json => @flights.map{ |f| f.waypoints }
  end

  def waypointsJsonForFlight
    render :json => @flight.waypoints
  end

  def new
    @flight = Flight.new theater: Settings.theaters.first.first,
                         start_airbase: Settings.theaters.first.last.airbases.first.first,
                         land_airbase: Settings.theaters.first.last.airbases.first.first,
                         departure: Settings.theaters.first.last.airbases.first.last.departures&.first&.first,
                         recovery: Settings.theaters.first.last.airbases.first.last.recoveries&.first&.first
  end

  def edit
    @loadout = Loadout.parse @flight.airframe, @flight.loadout
  end

  def create
    @flight = Flight.new(flight_params)

    if @flight.save
      redirect_to edit_flight_path(@flight), notice: 'Flight was successfully created.'
    else
      render :new
    end
  end

  def update
    data = flight_params
    data.merge!(loadout: nil) if @flight.airframe != data['airframe']
    if @flight.update(data)
      redirect_to @flight, notice: 'Flight was successfully updated.'
    else
      render :edit
    end
  end

  def destroy
    @flight.destroy
    redirect_to flights_url, notice: 'Flight was successfully destroyed.'
  end

  def clone
    src_flight = @flight
    @flight = src_flight.dup
    @flight.start = Date.tomorrow if @flight.start.past?
    @flight.save!
    src_flight.waypoints.each do |wp|
      new_wp = wp.dup
      new_wp.flight = @flight
      new_wp.save!
    end
    redirect_to edit_flight_path(@flight), notice: 'Flight successfully cloned.'
  end

  def print
    send_data create_pdf, filename: "mission_#{@flight.id}.pdf", type: 'application/pdf', disposition: :inline
  end

  def print_images
    stringio = ::Zip::OutputStream.write_buffer do |zip|
      images.each_with_index do |image, index|
        image.resize! 540, 814
        image.alpha Magick::RemoveAlphaChannel
        image.format = 'png'
        zip.put_next_entry sprintf('mdc_%d_%02d.png', @flight.id, index)
        zip.write image.to_blob
      end
      add_attachments_to_zip(zip)
    end
    stringio.rewind
    send_data stringio.sysread, filename: "mission_#{@flight.id}.zip", type: 'application/zip'
  end

  def defaults
    callsign = [params[:cs], params[:n]].select(&:present?).join('_').downcase
    global_defaults = Settings.defaults && Settings.defaults[callsign]&.to_h || {}
    theater_defaults = Settings.theaters[params[:t]].defaults && Settings.theaters[params[:t]].defaults[callsign]&.to_h || {}
    @defaults = global_defaults.merge theater_defaults
    render json: @defaults
  end

  private

  def images
    Magick::Image.from_blob(MissionDataCard.new(@flight).render) do
      self.density = '100'
      self.colorspace = Magick::RGBColorspace
    end
  end

  def add_attachments_to_zip(zip)
    attachments.each_with_index do |attachment, index|
      zip.put_next_entry sprintf('mdc_%d_plate_%02d.png', @flight.id, index)
      zip.write to_image(attachment)
    end
  end

  def attachments
    array = []
    if @flight.start_airbase
      array << Rails.root.join('public', @flight.theater, @flight.start_airbase, 'ad.pdf')
      array << Rails.root.join('public', @flight.theater, @flight.start_airbase, 'departures', "#{@flight.departure}.pdf")
    end
    if @flight.land_airbase
      array << Rails.root.join('public', @flight.theater, @flight.land_airbase, 'recoveries', "#{@flight.recovery}.pdf")
      array << Rails.root.join('public', @flight.theater, @flight.land_airbase, 'ad.pdf') if @flight.start_airbase != @flight.land_airbase
    end
    if @flight.divert_airbase
      array << Rails.root.join('public', @flight.theater, @flight.divert_airbase, 'recoveries', "#{@flight.divert}.pdf")
      array << Rails.root.join('public', @flight.theater, @flight.divert_airbase, 'ad.pdf')
    end

    array
  end

  def to_image(pdf_path)
    png_path = pdf_path.sub_ext '.png'
    if png_path.exist? && png_path.mtime >= pdf_path.mtime
      File.read png_path
    else
      images = Magick::ImageList.new(pdf_path) do
        self.density = '200'
        self.colorspace = Magick::RGBColorspace
      end
      image = images.first
      image.resize! 540 * 2, 814 * 2
      image.alpha Magick::RemoveAlphaChannel
      image.format = 'png'
      image.write png_path
      image.to_blob
    end
  end

  def set_flight
    @flight = Flight.find(params[:id])
  end

  def flight_params
    params.require(:flight).permit(:theater, :airframe, :ao, :start, :duration, :callsign, :callsign_number, :slots,
                                   :mission, :task, :minimum_weather_requirements, :group_id, :laser, :tacan_channel, :tacan_polarization,
                                   :frequency, :notes, :start_airbase, :land_airbase, :divert_airbase, :departure, :recovery, :divert,
                                   :radio1, :radio2, :radio3, :radio4, :iff,
                                   :target_fuel, :joker_fuel, :bingo_fuel, :landing_fuel, :landing_weight,
                                   support: [])
  end

  def create_pdf
    mdc = MissionDataCard.new @flight
    combine_pdf = CombinePDF.parse mdc.render
    attachments.each { |attachment| combine_pdf << CombinePDF.load(attachment) }
    combine_pdf.to_pdf
  end

  def all_flights?
    session[:all_flights] ? true : false
  end

  def set_all_flights
    session[:all_flights] = ActiveModel::Type::Boolean.new.cast params[:all]
  end
end
