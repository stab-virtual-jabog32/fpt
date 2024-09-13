class Loadout < OpenStruct
  extend ActiveModel::Naming

  def initialize(airframe, hash = {})
    @airframe = airframe
    super hash.to_h.reject { |_, v| v.blank? }
  end

  def self.parse(airframe, loadout)
    Rails.logger.debug("Parsing loadout for airframe: #{airframe}")
    data = loadout&.split&.map do |e|
      k, v = e.split /:/
      [k.to_sym, v]
    end
    Rails.logger.debug("Parsed data: #{data.inspect}")
    new(airframe, data.to_h)
  rescue => e
    Rails.logger.error("Error parsing loadout: #{e.message}")
    raise
  end

  def to_s
    to_h.map { |k, v| "#{k}:#{v}" }.join ' '
  end

  def a2a(text: :name)
    select_payload types: %w[a2a], text: text
  end

  def a2g(text: :name)
    select_payload types: %w[a2g agm rockets], text: text
  end

  def tanks(text: :name)
    select_payload types: %w[tank], text: text
  end

  def pods(text: :name)
    select_payload types: %w[pod], text: text
  end

  def gun_amount
    @table[:g]&.split(/,/)&.first || 100
  end

  def gun_type
    @table[:g]&.split(/,/)&.second
  end

  def gun
    return '' unless @table[:g] && Settings.airframes[@airframe].gun

    type = Settings.airframes[@airframe].gun.types[gun_type]
    "#{gun_amount}% #{type}"
  end

  def chaff
    @table[:e]&.split(/,/)&.first
  end

  def flares
    @table[:e]&.split(/,/)&.last
  end

  def fuel
    return '' unless @table[:f]

    "#{@table[:f]}%"
  end

  def total_weight
    empty_weight + payload_weight + fuel_weight
  end

  def empty_weight
    Settings.airframes[@airframe].weight.empty
  end

  def payload_weight
    @payload_weight ||= options.map(&:weight).sum + gun_weight
  end

  def gun_weight
    g = @table[:g]&.to_i || 100
    Settings.airframes[@airframe].gun.weight * g / 100
  end

  def fuel_weight
    external_fuel_weight + internal_fuel_weight
  end

  def external_fuel_weight
    options.map(&:fuel).compact.sum
  end

  def internal_fuel_weight
    return 0 unless Settings.airframes[@airframe].weight&.fuel

    f = @table[:f]&.to_i || 100
    Settings.airframes[@airframe].weight.fuel * f / 100
  end

  def options
    @options ||= @table.reject { |k, _| %i[g f e].include? k }.values.map { |v| LoadoutOption.parse v }
  end

  private

  def select_payload(types:, text:)
    payload_amounts.select { |key| types.include? Settings.payload[key].type }
                   .map { |key, amount| payload_text(amount, key, text) }.join(', ')
  end

  def payload_text(amount, key, text)
    amount = amount > 1 ? "#{amount}x" : ''
    name = Settings.payload[key].send(text) || Settings.payload[key].name
    amount + name
  end

  def payload_amounts
    @table.reject { |k, _| %i[g f e].include? k }.values.each_with_object({}) do |v, h|
      amount, payload = v.split /\*/, 2
      amount = amount.to_i
      payload = v if amount.zero?
      payload = payload.split(/,/).first
      h[payload] = amount + (h[payload] || 0)
    end
  end
end
