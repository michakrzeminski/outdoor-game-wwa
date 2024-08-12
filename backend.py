from flask import Flask, jsonify, request
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)

# TODO co bedzie robil backend server?
# 1. punktacja

# TODO deployment:
# ec2 isntance na AWSie, linux z pythonem i flaskiem
# to wyciagnac do internetu i frontend albo w s3 albo w github pages gdzie bedzie sie odwolywac do ec2 linka

team_count = 2

f = open('districts.geojson', encoding='utf-8')   
districts_geojson = json.load(f)
for i in districts_geojson["features"]:
    name = i["properties"]["name"]
    prop = i["properties"]
    prop["leading_team"] = -1
    prop["leading_score"] = 0
    prop["team1"] = 0
    prop["team2"] = 0
    prop["team3"] = 0
    prop["team4"] = 0
    prop["parks"] = {}
f.close()

f = open('parks.geojson', encoding='utf-8')   
parks_geojson = json.load(f)
for park in parks_geojson["features"]:
    name = park["properties"]["name"]
    district_name = park["properties"]["district"]
    park["properties"]["team"] = 0
    for feat in districts_geojson["features"]:
        if feat["properties"]["name"] == district_name:
            feat["properties"]["parks"][name] = park["properties"]["team"]
f.close()


# Route to get all districts
@app.route('/districts', methods=['GET'])
def get_districts():
    return districts_geojson


# Route to get all districts
@app.route('/parks', methods=['GET'])
def get_parks():
    return parks_geojson


# Reset
@app.route('/reset', methods=['GET'])
def reset():
    global districts_geojson, parks_geojson
    f = open('districts.geojson', encoding='utf-8')   
    districts_geojson = json.load(f)
    for i in districts_geojson["features"]:
        name = i["properties"]["name"]
        prop = i["properties"]
        prop["leading_team"] = -1
        prop["leading_score"] = 0
        prop["team1"] = 0
        prop["team2"] = 0
        prop["team3"] = 0
        prop["team4"] = 0
        prop["parks"] = {}
    f.close()

    f = open('parks.geojson', encoding='utf-8')   
    parks_geojson = json.load(f)
    for park in parks_geojson["features"]:
        name = park["properties"]["name"]
        district_name = park["properties"]["district"]
        park["properties"]["team"] = 0
        for feat in districts_geojson["features"]:
            if feat["properties"]["name"] == district_name:
                feat["properties"]["parks"][name] = park["properties"]["team"]
    f.close()
    return "OK"


@app.route('/points', methods=['GET'])
def get_points():
    # first clear the score
    points = [0,0,0,0,0]
    for feat in districts_geojson["features"]:
        if feat["properties"]["leading_team"] != -1:
            points[int(feat["properties"]["leading_team"])] += 1
    return points


# Route to add or update a district
@app.route('/updatedistrict', methods=['POST'])
def update_district():
    data = request.json
    if("district" not in data):
        return "Error", 400
    district_name = data["district"]
    park_name = data["park"]
    team_name = data["team"]

    for feat in parks_geojson["features"]:
        if feat["properties"]["name"] == park_name:
            if team_name != feat["properties"]["team"]:
                feat["properties"]["team"] = team_name
                for d in districts_geojson["features"]:
                    if d["properties"]["name"] == district_name:
                        d["properties"]["parks"][park_name] = team_name
                        d["properties"]["team"+str(team_name)] += 1
                        if d["properties"]["team"+str(team_name)] > d["properties"]["leading_score"]:
                            d["properties"]["leading_score"] = d["properties"]["team"+str(team_name)]
                            d["properties"]["leading_team"] = team_name

    return jsonify({district_name: data}), 200


if __name__ == '__main__':
    app.run(debug=True)
