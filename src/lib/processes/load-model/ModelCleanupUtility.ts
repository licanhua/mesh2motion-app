import { Box3, type Group, type Object3DEventMap, type Object3D, Scene, Mesh } from 'three'

/**
 * Utility helpers to clean up and normalize loaded model geometry.
 */
export class ModelCleanupUtility {
  public static calculate_bounding_box (scene_object: Scene | Group<Object3DEventMap>): Box3 {
    let bounding_box: Box3 = new Box3()

    scene_object.traverse((child: Object3D) => {
      const test_bb = new Box3().setFromObject(child)
      if (test_bb.max.x - test_bb.min.x > bounding_box.max.x - bounding_box.min.x ||
          test_bb.max.y - test_bb.min.y > bounding_box.max.y - bounding_box.min.y ||
          test_bb.max.z - test_bb.min.z > bounding_box.max.z - bounding_box.min.z) {
        bounding_box = test_bb
      }
    })

    return bounding_box
  }

  public static scale_model_on_import_if_extreme (scene_object: Scene | Group<Object3DEventMap>): void {
    let scale_factor = 1.0

    const bounding_box = this.calculate_bounding_box(scene_object)
    const height = bounding_box.max.y - bounding_box.min.y
    const width = bounding_box.max.x - bounding_box.min.x
    const depth = bounding_box.max.z - bounding_box.min.z

    const largest_dimension = Math.max(height, width, depth)

    if (largest_dimension > 0.5 && largest_dimension < 8) {
      console.log('Model a reasonable size, so no scaling applied: ', bounding_box, ' units is bounding box')
      return
    } else {
      console.log('Model is very large or small, so scaling applied: ', bounding_box, ' units is bounding box')
    }

    scale_factor = 1.5 / height

    scene_object.traverse((child) => {
      const child_obj = child as Mesh
      if (child_obj.geometry) {
        console.log('Scaling mesh:', child_obj, ' by factor of ', scale_factor)
        child_obj.geometry.scale(scale_factor, scale_factor, scale_factor)
        child_obj.geometry.computeBoundingBox()
        child_obj.geometry.computeBoundingSphere()
      }
    })
  }

  public static move_model_to_floor (mesh_data: Scene | Group<Object3DEventMap>): void {
    let final_lowest_point = 0
    mesh_data.traverse((obj: Object3D) => {
      if (obj.type === 'Mesh') {
        const mesh_obj: Mesh = obj as Mesh
        const bounding_box = new Box3().setFromObject(mesh_obj)

        if (bounding_box.min.y < final_lowest_point) {
          final_lowest_point = bounding_box.min.y
        }
      }
    })

    mesh_data.traverse((obj: Object3D) => {
      if (obj.type === 'Mesh') {
        const mesh_obj: Mesh = obj as Mesh

        const offset = final_lowest_point * -1
        mesh_obj.geometry.translate(0, offset, 0)
        mesh_obj.geometry.computeBoundingBox()
        mesh_obj.geometry.computeBoundingSphere()
      }
    })
  }
}
