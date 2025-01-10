class CreatePackages < ActiveRecord::Migration[6.0]
  def change
    create_table :packages do |t|
      t.string :task
      t.string :ao
      t.string :frequency
      t.integer :lead_flight_id, foreign_key: true # Reference to the flight that is the lead

      t.timestamps
    end

    add_reference :flights, :package, foreign_key: true # Link flights to packages
  end
end
