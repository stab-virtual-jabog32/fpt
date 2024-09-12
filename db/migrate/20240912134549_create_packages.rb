class CreatePackages < ActiveRecord::Migration[6.0]
  def change
    create_table :packages do |t|
      t.string :task
      t.string :ao
      t.string :frequency
      t.integer :lead_flight_id

      t.timestamps
    end
  end
end
