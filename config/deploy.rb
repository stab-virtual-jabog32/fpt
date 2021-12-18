# config valid for current version and patch releases of Capistrano
lock "~> 3.16.0"

set :application, "fpt"
set :repo_url, "https://github.com/stab-virtual-jabog32/fpt.git"

set :assets_manifests, ['app/assets/config/manifest.js']
set :rails_assets_groups, :assets
set :normalize_asset_timestamps, %w{public/images public/javascripts public/stylesheets}

set :deploy_to, '/home/fpt/www2'

append :linked_dirs, 'log', 'tmp'
