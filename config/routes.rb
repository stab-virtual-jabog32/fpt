Rails.application.routes.draw do
  root 'flights#index'

  # Flight-related routes
  resources :flights do
    collection do
      get :defaults
      get '(:date).waypoints.json', action: 'waypointsJsonForDate'
    end
    member do
      get :print
      get :print_images
      post :clone
      get 'waypoints.json', action: 'waypointsJsonForFlight'
    end
    resources :pilots
    resources :waypoints, only: %i[index create destroy] do
      member do
        post :update
        post :up
        post :down
      end
      collection do
        put :copy_from
        put :import
        get :export
      end
    end
    resource :loadout, only: %i[edit update]
  end

  # Package-related routes
  resources :packages, only: %i[index new create edit update destroy]

  # Additional routes
  get 'airbases', to: 'airbases#index'
  get 'procedures', to: 'airbases#procedures'
  get 'spins', to: 'spins#show'
  get 'mdc/:pilot', to: 'mdc#show', as: 'mdc'

  # Catch-all route
  get '*anythingelse', to: redirect('/404')
end
