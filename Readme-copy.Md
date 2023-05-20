# Map Data Grouper

You can use the data mapper to do the following on the plots you see on the map - 

- Group Points and combine them to a centroid
- Split already combined points to individual plots.
- Remove individual or group of points from existing group without effecting the group itself

## Shortcuts

p - Activate Polygon Tool (To draw polygons to combine)
esc - Activate Hand Tool (To move the map)
ctrl + z - Undo action
c - combine points (Simulates Combine Button)
q - Map View (Roadmap Mode)
w - Satelite View

## How To use the tools?

### Group or Combine Points
Click on the Polygon icon or press p on your keyboard and draw a polygon around points.The points inside the polygon will be highlighted to **yellow** color. 

After you are done selecting the points, you can add more points to the same group by drawing more polygons and the points inside the polygons should keep on adding until you press the Combine button.

When you combine the points, we should have a centroid and lines from the centroid to the individual point lat lng attributes.

You can also add points to already combined points. Draw a polygon and keep the centroid inside the area of the polygon. At this point, whatever comes between the polygon area will be combined. They might stand along points or already combined points.

### Split Points
Suppose you have a group of points that are already comnined, you can split the points by drawing a polygon and keepint the centroid inside the polygon. Click on the Split button and all the points should be distinct and not have a parent.

### Remove From Group
Lets say you accidentally combined a bunch of points to a centroid. You can select line(s) connecting the centroid to the point and click on the Remove from Group button to make them individual plots. At this point, the points will no longer belong to the previous combination.


### Clear
When you select a bunch of points by drawing a polygon, you can click the Clear to move back to the previous state and thereon you can select points to continue.

Clicking on the clear button will not remove the already combined points.


### Undo
Clicking on the Undo button will move the state of the app to the point before clicking the last Combine button. It remembers upto 25 levels.