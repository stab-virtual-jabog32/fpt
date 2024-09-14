# app/models/loadout_template.rb
class LoadoutTemplate < ApplicationRecord
  # Simply store the airframe as a string
  validates :airframe, presence: true
  validates :name, presence: true, uniqueness: { scope: :airframe }
  validates :loadout, presence: true
end
