# app/models/loadout_template.rb
class LoadoutTemplate < ApplicationRecord
    belongs_to :airframe, class_name: 'Flight', foreign_key: 'airframe'
    
    validates :name, presence: true, uniqueness: { scope: :airframe }
    validates :loadout, presence: true
  end