class CreateLoadoutTemplates < ActiveRecord::Migration[6.1]
  def change
    create_table :loadout_templates do |t|
      t.string :name, null: false                # Name of the template
      t.string :airframe, null: false            # Airframe the template is associated with
      t.text :loadout, null: false               # The loadout data as text or JSON
      t.references :user, foreign_key: true      # Optional: if you want to associate templates with users
      t.timestamps
    end

    add_index :loadout_templates, [:name, :airframe], unique: true # Ensure unique template names per airframe
  end
end
