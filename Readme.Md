# Map Data Grouper

The Map Data Grouper allows you to perform the following actions on the plots displayed on the map:

- Group points and combine them into a centroid.
- Split already combined points into individual plots.
- Remove individual or groups of points from existing groups without affecting the group itself.

## Shortcuts

>**p**: Activate Polygon Tool (to draw polygons for grouping)\
>**esc**: Activate Hand Tool (to move the map)\
>**ctrl + z**: Undo action\
>**c**: Combine points (simulates Combine Button)\
>**q**: Map View (Roadmap Mode)\
>**w**: Satellite View

## How to Use the Tools?

### Group or Combine Points

1. Click on the Polygon icon or press **p** on your keyboard to activate the Polygon Tool.
2. Draw a polygon around the points you want to group. The points inside the polygon will be highlighted in **yellow**.

![Combine Points 1](./assets/readme/group-1.gif)

3. To add more points to the same group, draw additional polygons. The points inside these polygons will be added to the existing group.

![Combine Points 2](./assets/readme/group-2.gif)

4. When you're ready to combine the points, press the Combine button. You will get a popup to either Enter Address manually or click on the map to select address from a point. The result will be a centroid and lines connecting the centroid to the individual point lat/lng attributes.

![Combine Points 3](./assets/readme/group-3.gif)

5. You can also add points to an already combined group. Draw a polygon and ensure that the centroid is inside the polygon's area. Any points within the polygon area will be combined, including standalone points or previously combined groups.

![Combine Points 4](./assets/readme/group-4.gif)

![Combine Points 5](./assets/readme/group-5.gif)

### Split Points

1. If you have a group of already combined points, you can split them into individual plots.
2. Draw a polygon around the group, making sure the centroid is inside the polygon's area.
3. Click the Split button. All the points in the group will become distinct and will not have a parent group.

![Split Points](./assets/readme/split-1.gif)

### Remove From Group

1. If you accidentally combined a bunch of points to a centroid, you can remove individual points from the group.
2. Select the hand tool and select the line(s) connecting the centroid to the point(s) you want to remove.
3. Click the Remove from Group button. The selected points will become individual plots and will no longer belong to the previous combination.

![Remove From Group](./assets/readme/remove-1.gif)

### Clear

1. When you select a bunch of points by drawing a polygon, you can click Clear to return to the previous state. You can then select additional points to continue grouping.
2. Note that clicking the Clear button will not remove the points that have already been combined.

![Clear](./assets/readme/clear-1.gif)

### Undo

1. Clicking the Undo button will revert the state of the app to the point before clicking the last Combine, Remove From Group & Split buttons. The app remembers up to 25 levels of undo history.

![Undo](./assets/readme/undo-1.gif)