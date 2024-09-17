# Flight Planning Tool (FPT) for DCS Squadron
##Overview
**The Flight Planning Tool (FPT)** is a vJaBoG32 specific Fork of ```/obfuscoder/fpt``` is a Ruby on Rails web application designed for virtual squadrons in the DCS (Digital Combat Simulator) environment. This tool allows pilots and air traffic controllers (ATCs) to manage flight plans, share them with ATC, and export relevant data to LUA files for DCS mods (e.g., Kneeboards, Waypoints). The app integrates with DCS to enhance mission planning and execution, providing centralized management of flights and their associated data.

## Features
- Flight Plan Management: Create, edit, and view flight plans.
- ATC Visibility: Allows ATCs to view and manage flight information in real-time.
- LUA Export: Exports flight plans and waypoints into LUA format for easy integration with DCS mods (Kneeboard).
- Integration with DCS: Seamless export and sharing of relevant flight data between the web app and DCS.
- Approach Charts: Hosts PDFs (located in /public) with approach charts to assist pilots.

## Prerequisites
Before setting up the application, ensure that the following tools and dependencies are installed:
- Ruby (version specified in .ruby-version)
- Rails (version specified in Gemfile)
- PostgreSQL or other supported database
- Node.js and Yarn (for handling JavaScript and CSS assets)

See further information below, how to install prerequisites.

## Setup
### 1. Clone the Repository
```bash
git clone https://github.com/stab-virtual-jabog32/fpt
```

### 2. Install Dependencies
Run the following command to install required gems:
```bash
bundle install
```
For JavaScript and CSS dependencies, use:
```bash
yarn install
```

### 3. Database Setup 
Ensure that your PostgreSQL server is running and then create and migrate the database:
```bash
rails db:create
rails db:migrate
```

### 4. Start the Rails Server
To run the application locally, use:
```bash
rails server
```

## 1. Install Ruby
It’s recommended to use a version manager like rbenv to install Ruby, as it allows you to manage different Ruby versions easily.

Using <rbenv>:
**Step 1: Install <rbenv> and <ruby-build>**
```bash
# Install rbenv and ruby-build
sudo apt update
sudo apt install -y rbenv build-essential libssl-dev libreadline-dev zlib1g-dev

# Set up rbenv
echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(rbenv init -)"' >> ~/.bashrc
source ~/.bashrc

# Install ruby-build to easily install Ruby versions
git clone https://github.com/rbenv/ruby-build.git ~/.rbenv/plugins/ruby-build
```


**Step 2: Install Ruby (version specified in <.ruby-version>)**
```bash
# Install Ruby (use the version from .ruby-version file)
rbenv install <ruby-version>
rbenv global <ruby-version>

# Verify the installation
ruby -v
```

**Step 3: Install Rails**
Once Ruby is installed, you can install Rails using the gem package manager:
```bash
# Install Rails
gem install rails -v <rails-version>

# Verify the installation
rails -v
```

Make sure the Rails version is compatible with the one specified in the Gemfile.


**Step 4: Install PostgreSQL**
PostgreSQL is the recommended database for this application. Use the following commands to install and set it up:stall Rails using the gem package manager:
```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib libpq-dev

# Start the PostgreSQL service
sudo service postgresql start
```

Once PostgreSQL is installed, you will need to create a user that matches your Linux username:
```bash
# Switch to the PostgreSQL shell
sudo -u postgres psql

# Create a user (replace 'your_username' with your Linux username)
CREATE USER your_username WITH SUPERUSER PASSWORD 'your_password';

# Exit the PostgreSQL shell
\q
```

You can modify the database settings in <config/database.yml> to use this user.

After configuring the user and the database, create the database:
```bash
rails db:create
rails db:migrate
```

**Step 5: Install Yarn**
Yarn is used to manage front-end dependencies (JavaScript libraries). It’s required for handling Rails assets like CSS and JS.
```bash
# Add Yarn package repository
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list

# Update package list and install Yarn
sudo apt update
sudo apt install yarn

# Verify installation
yarn -v
```

**Step 6: Install Application Dependencies**
Now that the system is ready, install the required gems and JavaScript dependencies for the application
```bash
# Install Ruby dependencies (gems)
bundle install

# Install JavaScript/CSS dependencies
yarn install
```

**Step 7: Start the Rails Server**
Once all dependencies are installed, start the Rails server with the following command:
```bash
rails server
```

The server will be available at <http://localhost:3000>.

## How to Pull Request
Please only use rebase option for easy changes (e.g. JSON config update for adding a user)