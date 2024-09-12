class Package < ApplicationRecord
    has_many :flights
    belongs_to :lead_flight, class_name: 'Flight', optional: true # The lead flight in the package
  
    validates :task, presence: true
    validates :ao, presence: true
    validates :frequency, presence: true
  end
  