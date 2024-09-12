class Package < ApplicationRecord
  has_many :flights, dependent: :nullify # Flights should remain if the package is deleted
  belongs_to :lead_flight, class_name: 'Flight', optional: true # The lead flight in the package

  validates :task, presence: true
  validates :ao, presence: true
  validates :frequency, presence: true

  validate :lead_flight_must_be_part_of_package

  private

  def lead_flight_must_be_part_of_package
    if lead_flight && !flights.include?(lead_flight)
      errors.add(:lead_flight, "must be one of the package's flights")
    end
  end
end
